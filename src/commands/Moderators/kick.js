'use strict';

const { MessageEmbed } = require('discord.js');
const Log = require('../../models/Log');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'kick',
      arguments: {
        member: {
          type: 'user',
          required: true,
        },
        reason: {
          type: 'spaceString',
        },
      },
    });
  }
  async run({ args, message }) {
    const guild = message.guild;

    const settings = moderationConfig[guild.id];
    if (!settings) return;

    if (!settings.allowedCommands.includes(this.name)) {
      sendErrorMessage({
        message,
        content: 'Недоступно на этом сервере!',
        member: message.member,
      });
      return;
    }

    const [memberString, reason] = args;

    const member = guild.member(memberString.match(/\d{18}/)[0]);
    if (!member) {
      sendErrorMessage({
        message,
        content: 'Указанный пользователь не найден на сервере',
        member: message.member,
      });
      return;
    }

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

    if (
      member.user.bot ||
      member.hasPermission('ADMINISTRATOR') ||
      member.roles.cache.some(r => settings.inviolableRoles.includes(r.id))
    ) {
      sendErrorMessage({
        message,
        content: 'Вы не можете кикнуть этого пользователя!',
        member: message.member,
      });
      return;
    }

    await member.kick(reason || 'Неуказано');

    const logMessage = new Log({
      usersID: [message.member.id, member.id],
      origin: message.member.id,
      discordData: {
        guildID: guild.id,
        channelID: message.channel.id,
        messageID: message.id,
      },
      actionID: 7,
      details: {
        reason,
      },
    });
    await logMessage.save();

    message.channel.send(
      new MessageEmbed().setAuthor(
        `${member.user.username} был кикнут с причиной ${reason || 'Неуказано'}`,
        member.user.avatarURL(),
      ),
    );
  }
};
