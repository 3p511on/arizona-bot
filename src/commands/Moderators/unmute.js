'use strict';

const { MessageEmbed } = require('discord.js');
const Punishment = require('../../models/Punishment');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'unmute',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
      arguments: {
        member: {
          type: 'user',
          required: true,
        },
      },
    });
  }
  async run({ args, message }) {
    const guild = message.guild;

    const settings = moderationConfig[guild.id];
    if (!settings) return;

    const [memberString] = args;

    const member = guild.member(memberString.match(/\d{18}/)[0]);
    if (!member) {
      sendErrorMessage({
        message,
        content: 'Указанный пользователь не найден на сервере',
        member: message.member,
      });
      return;
    }

    const role = guild.roles.cache.get(settings.mutedRole);
    if (!role) throw new Error('Роль Muted для этого сервера не найдена');

    if (
      !message.member.hasPermission('ADMINISTRATOR') &&
      !message.member.roles.cache.some(r => settings.moderatorRoles.includes(r.id))
    ) {
      sendErrorMessage({
        message,
        content: 'У вас нет прав!',
        member: message.member,
      });
      return;
    }

    if (!member.roles.cache.has(role.id)) {
      sendErrorMessage({
        message,
        content: 'Этот пользователь не в муте!',
        member: message.member,
      });
      return;
    }

    member.roles.remove(role);

    const mute = await Punishment.findOne({
      guildID: guild.id,
      userID: member.id,
      type: 0,
    });

    if (mute) Punishment.findByIdAndRemove(mute.id).exec();

    message.channel.send(
      new MessageEmbed().setAuthor(`${member.user.username} был размучен!`, member.user.avatarURL()),
    );
  }
};
