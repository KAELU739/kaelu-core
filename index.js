//=========================
// ログイン処理
//=========================

import { Client, GatewayIntentBits, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { EmbedBuilder } from "discord.js";

// File 読み込み
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

// GatewayIntentBits 設定
const intentMap = {
  Guilds: GatewayIntentBits.Guilds,
  GuildMessages: GatewayIntentBits.GuildMessages,
  MessageContent: GatewayIntentBits.MessageContent,
  GuildVoiceStates: GatewayIntentBits.GuildVoiceStates,
  GuildMembers: GatewayIntentBits.GuildMembers,
  GuildPresences: GatewayIntentBits.GuildPresences
};

//=========================
// Bot 起動
//=========================
config.bots.forEach(async (botConfig) => {
  const client = new Client({
    intents: botConfig.intents.map((i) => intentMap[i])
  });

  //=========================
  // コマンド読み込み
  //=========================
  client.commands = new Collection();

  const commandsPath = path.resolve(botConfig.commandsDir);
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href;
    const command = await import(fileUrl);
    client.commands.set(command.data.name, command);
  }

  //=========================
  // ログイン情報
  //=========================
  client.once("clientReady", () => {
    console.log(`✅ ログイン成功 : ${client.user.tag} (${botConfig.name})`);
  });

  //=========================
  // コマンド実行処理
  //=========================
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: "エラーが発生しました。",
        ephemeral: true
      });
    }
  });

  //=========================
  // スレッド監視（Bot2専用）
  //=========================
  client.on("threadCreate", async (thread) => {
    if (!botConfig.threadWatch) return;

    const watch = botConfig.threadWatch;

    if (thread.parentId !== watch.watchChannelId) return;

    const alertChannel = await client.channels.fetch(watch.alertChannelId).catch(() => null);
    if (!alertChannel) return;

    alertChannel.send({
      content: `👀 <@&1453298616339922985>\n新しい提案 (<${thread.url}>)`
    });
  });

  //=========================
  // Bot2: アクティブ人数でVC名を更新
  //=========================
  client.once("clientReady", () => {
    if (!botConfig.activeVoice) return;

    console.log(`🔧 VC名自動更新を開始 (${botConfig.name})`);

    setInterval(async () => {
      try {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        await guild.members.fetch();

        const total = guild.memberCount;
        const online = guild.members.cache.filter(
          (m) => m.presence && m.presence.status !== "offline"
        ).size;

        const channel = guild.channels.cache.get(botConfig.activeVoice.channelId);
        if (!channel) return;

        const newName = `アクティブ人数 (${online}/${total})`;

        if (channel.name !== newName) {
          await channel.setName(newName);
          console.log(`🔄 アクティブ人数更新 : (${newName})`);
        }
      } catch (err) {
        console.error("VC名更新エラー:", err);
      }
    }, 60000);
  });

  //=========================
  // Bot2: 固定メッセージ（ここが正しい位置）
  //=========================
  if (botConfig.keepLatestMessage) {

    const latestMsgPath = "./latestMessage.json";
    let latestMsg = { messageId: null };

    try {
      latestMsg = JSON.parse(fs.readFileSync(latestMsgPath, "utf8"));
    } catch {
      fs.writeFileSync(latestMsgPath, JSON.stringify(latestMsg, null, 2));
    }

    //=========================
    // 起動時に固定メッセージが無ければ送信
    //=========================
    client.once("clientReady", async () => {
      const targetChannelId = botConfig.keepLatestMessage.channelId;
      const content = botConfig.keepLatestMessage.content;

      const channel = await client.channels.fetch(targetChannelId).catch(() => null);
      if (!channel) return;

      if (!latestMsg.messageId) {
        const newMsg = await channel.send(content);
        latestMsg.messageId = newMsg.id;
        fs.writeFileSync(latestMsgPath, JSON.stringify(latestMsg, null, 2));
        console.log("📌 最初の固定メッセージを送信しました");
      }

      //=========================
      // 新規メッセージ検知で固定メッセージ更新
      //=========================
      client.on("messageCreate", async (message) => {
        if (message.author.bot) return;
        if (message.channel.id !== targetChannelId) return;

        if (latestMsg.messageId) {
          try {
            const oldMsg = await message.channel.messages.fetch(latestMsg.messageId);
            if (oldMsg) await oldMsg.delete();
          } catch {}
        }

        const newMsg = await message.channel.send(content);
        latestMsg.messageId = newMsg.id;
        fs.writeFileSync(latestMsgPath, JSON.stringify(latestMsg, null, 2));

        console.log("🔄 固定メッセージを更新しました");
      });
    });
  }

//=========================
// Bot2: NGワード検知 & 通知 & 回数記録（Embed）
//=========================
if (botConfig.wordDetect) {

  const wordsPath = "./words.json";
  const detectLogPath = "./detectLog.json";

  let words = [];
  let detectLog = {};

  try {
    words = JSON.parse(fs.readFileSync(wordsPath, "utf8")).words;
  } catch {
    console.log("words.json が読み込めません。");
  }

  try {
    detectLog = JSON.parse(fs.readFileSync(detectLogPath, "utf8"));
  } catch {
    fs.writeFileSync(detectLogPath, JSON.stringify({}, null, 2));
  }

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const alertChannelId = botConfig.wordDetect.alertChannelId;
    const alertChannel = await client.channels.fetch(alertChannelId).catch(() => null);
    if (!alertChannel) return;

    const content = message.content;

    const hit = words.find((w) => content.includes(w));
    if (!hit) return;

    const userId = message.author.id;

    if (!detectLog[userId]) detectLog[userId] = 0;
    detectLog[userId]++;

    fs.writeFileSync(detectLogPath, JSON.stringify(detectLog, null, 2));

    // Embed 作成
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("⚠️ NGワード検知")
      .addFields(
        { name: "ユーザー", value: `<@${userId}>`, inline: true },
        { name: "検知ワード", value: `**${hit}**`, inline: true },
        { name: "累計回数", value: `**${detectLog[userId]} 回**`, inline: true }
      )
      .setTimestamp();

    alertChannel.send({ embeds: [embed] });

    console.log(`NGワード検知: ${message.author.tag} (${hit})`);
  });
}

//=========================
// Bot2: メッセージ編集ログ（Embed）
//=========================
if (botConfig.messageLog) {

  const logPath = "./messageLog.json";
  let logData = { edited: [], deleted: [] };

  try {
    logData = JSON.parse(fs.readFileSync(logPath, "utf8"));
  } catch {
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
  }

  const alertChannelId = botConfig.messageLog.alertChannelId;

  client.on("messageUpdate", async (oldMsg, newMsg) => {
    if (!oldMsg.content || !newMsg.content) return;
    if (oldMsg.author?.bot) return;

    const alertChannel = await client.channels.fetch(alertChannelId).catch(() => null);
    if (!alertChannel) return;

    const entry = {
      userId: oldMsg.author.id,
      messageId: oldMsg.id,
      channelId: oldMsg.channel.id,
      before: oldMsg.content,
      after: newMsg.content,
      timestamp: Date.now()
    };

    logData.edited.push(entry);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle("✏️ メッセージ編集検知")
      .addFields(
        { name: "ユーザー", value: `<@${entry.userId}>` },
        { name: "チャンネル", value: `<#${entry.channelId}>` },
        { name: "Before", value: entry.before || "（空）" },
        { name: "After", value: entry.after || "（空）" }
      )
      .setTimestamp();

    alertChannel.send({ embeds: [embed] });
  });
}

//=========================
// Bot2: メッセージ削除ログ（Embed）
//=========================
if (botConfig.messageLog) {

  const logPath = "./messageLog.json";
  let logData = { edited: [], deleted: [] };

  try {
    logData = JSON.parse(fs.readFileSync(logPath, "utf8"));
  } catch {
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
  }

  const alertChannelId = botConfig.messageLog.alertChannelId;

  client.on("messageDelete", async (msg) => {
    if (!msg.content) return;
    if (msg.author?.bot) return;

    const alertChannel = await client.channels.fetch(alertChannelId).catch(() => null);
    if (!alertChannel) return;

    const entry = {
      userId: msg.author.id,
      messageId: msg.id,
      channelId: msg.channel.id,
      content: msg.content,
      timestamp: Date.now()
    };

    logData.deleted.push(entry);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    const embed = new EmbedBuilder()
      .setColor(0xff8800)
      .setTitle("🗑️ メッセージ削除検知")
      .addFields(
        { name: "ユーザー", value: `<@${entry.userId}>` },
        { name: "チャンネル", value: `<#${entry.channelId}>` },
        { name: "内容", value: entry.content || "（空）" }
      )
      .setTimestamp();

    alertChannel.send({ embeds: [embed] });
  });
}

  //=========================
  // ログイン
  //=========================

  
// token
const token = process.env[botConfig.token];
client.login(token);

  client.login(botConfig.token).catch((err) => {
    console.error(`❌ ログイン失敗 : (${botConfig.name})`, err);
  });
});