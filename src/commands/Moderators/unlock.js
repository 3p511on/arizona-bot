'use strict';

const { MessageEmbed } = require('discord.js');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'unlock',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
      arguments: {
        channel: {
          type: 'channel',
        },
      },
    });
  }
  async run({ args, message }) {
    const guild = message.guild;

    const settings = moderationConfig[guild.id];
    if (!settings) return;

    const [channelString] = args;

    const channel = channelString ? guild.channels.resolve(channelString.match(/\d{18}/)[0]) : message.channel;
    if (!channel) {
      sendErrorMessage({
        message,
        content: 'Указанный канал не найден на сервере',
        member: message.member,
      });
      return;
    }

    if (
      (!message.member.hasPermission('ADMINISTRATOR') &&
        !message.member.roles.cache.some(r => settings.moderatorRoles.includes(r.id))) ||
      !channel.permissionsFor(message.member).has('MANAGE_MESSAGES', true)
    ) {
      sendErrorMessage({
        message,
        content: 'У вас нет прав!',
        member: message.member,
      });
      return;
    }

    await channel.overwritePermissions([
      {
        id: message.guild.id,
        allow: ['SEND_MESSAGES'],
      },
    ]);

    message.channel.send(
      new MessageEmbed().setAuthor(
        `${channel.name} был разблокирован модератором ${message.member.displayName}`,
        message.member.user.avatarURL(),
      ),
    );
  }
};