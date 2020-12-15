'use strict';

const { MessageEmbed } = require('discord.js');
const { getFamilyByOwner, getFamilyByLeader } = require('../../handlers/family');
const Command = require('../../structures/Command');
const familyConfig = require('../../utils/config').familyConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'famaddzam',
    });
  }
  // eslint-disable-next-line consistent-return
  async run({ args, message }) {
    message.delete();

    const settings = familyConfig[message.guild.id];
    if (!settings) return this.sendError(message, 'Настройки для этого сервера не найдены');

    const category = message.guild.channels.cache.get(settings.categoryID);
    if (!category) return this.sendError(message, `Категория семей не найдена`);

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return this.sendError(message, `Используйте: \`/famaddzam [member/id]\``);

    if (member.bot) return this.sendError(message, `Вы не можете сделать этого пользователя заместителем`);

    const channel = getFamilyByOwner(message.member);
    if (!channel) return this.sendError(message, `У вас нет прав!`);

    const role = message.guild.roles.cache.find(r => r.name === channel.name);
    if (!role) return this.sendError(message, `Роль семьи не найдена`);

    if (!member.roles.cache.has(role.id)) return this.sendError(message, `Этот пользователь не состоит в вашей семье`);

    const mChannel = getFamilyByLeader(member);
    if (mChannel) return this.sendError(message, `Этото пользователь уже является заместителем`);

    await channel.updateOverwrite(member.id, {
      VIEW_CHANNEL: true,
      CONNECT: true,
      MUTE_MEMBERS: true,
    });

    message.channel
      .send(
        new MessageEmbed()
          .setColor(0x0fda37)
          .setTitle('Заместитель успешно добавлен')
          .setDescription(`${member} теперь заместитель семьи \`${channel.name}\``),
      )
      .then(msg => msg.delete({ timeout: 5000 }));
  }

  sendError(message, content) {
    message.channel.send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content));
  }
};
