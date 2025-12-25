//=========================
// 読み込み
//=========================
import fs from "fs";
import path from "path";
import { REST, Routes } from "discord.js";
import { pathToFileURL } from "url";

// config.json 直接読み込み
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

//=========================
// 登録処理
//=========================
async function deployCommands() {
  for (const bot of config.bots) {
    const commands = [];

    // コマンドフォルダ
    const commandsPath = path.resolve(bot.commandsDir);
    const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

    // コマンド読み込み
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);

      const fileUrl = pathToFileURL(filePath).href;

      const command = await import(fileUrl);
      commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: "10" }).setToken(bot.token);

    // 開始
    try {
      console.log(`📤 コマンド登録中 (${bot.name})`);

      await rest.put(
        Routes.applicationCommands(bot.clientId),
        { body: commands }
      );

      console.log(`✅ コマンド登録完了 (${bot.name})`);
    } catch (err) {
      console.error(`❌ コマンド登録失敗 (${bot.name})`, err);
    }
  }
}

deployCommands();