const penaltyRoleId = '1468292358293684315'; 
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const { loadDB, saveDB, getUser } = require('../../utils/database');

/**
 * قائمة المخالفات
 */
const violations = [
  { id: 'speed', name: 'تجاوز السرعة', fine: 500 },
  { id: 'signal', name: 'قطع إشارة', fine: 1000 },
  { id: 'parking', name: 'مخالفة وقوف خاطئ', fine: 200 },
  { id: 'wrong_lane', name: 'القيادة في مسار خاطئ', fine: 350 },
  { id: 'drift', name: 'تفحيط', fine: 3000 },
  { id: 'no_id', name: 'عدم حمل رخصه', fine: 300 }
  
];
// الرتب المسموح لها استخدام الأمر (بالآيدي)
const allowedRoleIds = [
  '1386689913411469343', // ضع هنا آيدي الرتبة الأولى
  '987654321098765432'  // أضف أو عدل الآيديات حسب الحاجة
];

module.exports = {
  name: 'مخالفة',
  adminOnly: false,

  // =============================
  // تنفيذ الأمر
  // =============================
  async execute(message) {
    // تحقق من الرتبة بالآيدي
    const hasRole = message.member.roles.cache.some(role => allowedRoleIds.includes(role.id));
    if (!hasRole) return message.reply(' ليس لديك صلاحية استخدام هذا الأمر.');

    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ منشن العضو');

    // جلب أول صورة مرفقة (إن وجدت)
    let imageUrl = null;
    if (message.attachments && message.attachments.size > 0) {
      const img = message.attachments.find(att => att.contentType && att.contentType.startsWith('image/'));
      if (img) imageUrl = img.url;
    }

    const embed = new EmbedBuilder()
      .setTitle('🚨 تسجيل مخالفة')
      .setDescription(`اختر نوع المخالفة لـ <@${target.id}>`)
      .setColor('Red');
    if (imageUrl) embed.setImage(imageUrl);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`mukhalafa_${target.id}`)
      .setPlaceholder('اختر المخالفة')
      .addOptions(
        violations.map(v => ({
          label: v.name,
          description: `الغرامة: ${v.fine}`,
          value: v.id
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await message.reply({
      embeds: [embed],
      components: [row]
    });
  },

  // =============================
  async onSelect(interaction) {
  if (!interaction.customId.startsWith('mukhalafa_')) return;

  await interaction.deferUpdate();

  const userId = interaction.customId.split('_')[1];
  const typeId = interaction.values[0];

  const infType = violations.find(v => v.id === typeId);
  if (!infType) return;

  const db = loadDB();
  const user = getUser(db, userId);

  // جلب صورة من الرسالة الأصلية (إن وجدت)
  let imageUrl = null;
  if (interaction.message.embeds && interaction.message.embeds[0] && interaction.message.embeds[0].image) {
    imageUrl = interaction.message.embeds[0].image.url;
  }

  let note;
  if (user.bank >= infType.fine) {
    user.bank -= infType.fine;
    note = 'وزاره الداخليه';
  } else {
    note = 'وزاره الداخليه';
  }

  user.violations.push({
    type: infType.name,
    fine: infType.fine,
    by: interaction.user.tag,
    date: Date.now()
  });

  saveDB(db);

  try {                         //العدد
    if (user.violations.length >= 5 && penaltyRoleId && interaction.guild) {
      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      if (member && !member.roles.cache.has(penaltyRoleId)) {
        await member.roles.add(penaltyRoleId).catch(() => {});
      }
    }
  } catch {}

  // 🔒 تعطيل الدروب داون
  const disabledMenu = new StringSelectMenuBuilder()
    .setCustomId('disabled')
    .setPlaceholder('تم تسجيل المخالفة')
    .setDisabled(true)
    .addOptions([{ label: infType.name, value: 'done' }]);

  const row = new ActionRowBuilder().addComponents(disabledMenu);

  const embed = new EmbedBuilder()
    .setTitle('🚨 تم قيد مخالفة عسكرية')
    .setColor('Red')
    .addFields(
      { name: ' العسكري', value: `<@${interaction.user.id}>`, inline: true },
      { name: ' المواطن ', value: `<@${userId}>`, inline: true },
      { name: ' نوع المخالفة', value: infType.name, inline: true },
      { name: 'سعر المخالفه ', value: `${infType.fine}`, inline: true },
      {
        name: '📅 التاريخ',
        value: `<t:${Math.floor(Date.now() / 1000)}:f>`,
        inline: false
      }
    )
    .setFooter({ text: note });
  if (imageUrl) embed.setImage(imageUrl);

  await interaction.editReply({
    embeds: [embed],
    components: [row]
  });

  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle('🚨 اشعار مخالفه ')
      .setColor('Red')
      .addFields(
        { name: ' العسكري', value: `<@${interaction.user.id}>`, inline: true },
        { name: ' المواطن ', value: `<@${userId}>`, inline: true },
        { name: ' نوع المخالفة', value: infType.name, inline: true },
        { name: 'سعر المخالفه ', value: `${infType.fine}`, inline: true },
        {
          name: '📅 التاريخ',
          value: `<t:${Math.floor(Date.now() / 1000)}:f>`,
          inline: false
        }
      )
      .setFooter({ text: note });
    if (imageUrl) dmEmbed.setImage(imageUrl);
    await interaction.client.users.send(userId, {
      embeds: [dmEmbed]
    });
  } catch {}
}};
