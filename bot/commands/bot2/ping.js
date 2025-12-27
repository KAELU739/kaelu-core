import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Bot のステータスを表示します");

export async function execute(interaction) {
  const ping = interaction.client.ws.ping;
  const uptime = interaction.client.uptime;

  const format = (ms) => {
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / (1000 * 60)) % 60;
    const hr = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const day = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${day}日 ${hr}時間 ${min}分 ${sec}秒`;
  };

  const embed = new EmbedBuilder()
    .setColor("#00A6FF")
    .setTitle("応答状況を調べます")
    .addFields(
      { name: "🏓 Ping", value: `${ping}ms`, inline: true },
      { name: "🕐 起動時間", value: format(uptime), inline: true },
      {
        name: "📼 メモリ",
        value: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        inline: true
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
