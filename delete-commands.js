//=========================
// 読み込み
//=========================
import { REST, Routes } from "discord.js";
import fs from "fs";

// config.json 直接読み込み
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

//=========================
// 削除処理
//=========================
async function deleteCommands() {
  for (const bot of config.bots) {
    const rest = new REST({ version: "10" }).setToken(bot.token);
    
    // 削除開始
    try {
      console.log(`🗑️ コマンドを削除中 (${bot.name})`);

      await rest.put(
        Routes.applicationCommands(bot.clientId),
        { body: [] }
      );

      // 結果通知
      console.log(`✅ コマンド削除完了 (${bot.name})`);
    } catch (err) {
      console.error(`❌ コマンド削除失敗 (${bot.name})`, err);
    }
  }
}

deleteCommands();