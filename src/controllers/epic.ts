import { Client, TextChannel } from 'discord.js';
import axios from 'axios';

import { config } from '../config';
import client from '../discord';

export const EpicController = {
 




//   /**
//    * @param {string} accessToken 
//    * @returns {Promise<{ success?: boolean; error?: string }>} 
//    */
//   validate: async (accessToken: string): Promise<{ success?: boolean; error?: string }> => {
//     try {
//       // Fetch user information
//       const userResponse = await axios.get('https://api.epicgames.dev/userinfo', {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       });

//       const userId = userResponse.data?.id;
//       if (!userId) {
//         return {
//           error: 'Failed to fetch user information. Please ensure you are logged in with Epic Games.',
//         };
//       }

//       // Fetch the user's game library
//       const libraryResponse = await axios.get(
//         `https://api.epicgames.dev/account/${userId}/library`,
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       const games = libraryResponse.data?.elements || [];
//       const game = games.find(
//         (g: any) =>
//           g.offerNamespace === config.epic.namespace &&
//           g.catalogItemId === config.epic.gameId
//       );

//       if (!game) {
//         return {
//           error: 'You do not own the game. Please close this window and step through the instructions again.',
//         };
//       }

//       return { success: true };
//     } catch (error) {
//       console.error('Error during Epic Games account validation:', error);
//       return {
//         error: error.response?.data?.error || error.message || 'An error occurred while validating the account.',
//       };
//     }
//   },

//   /**
//    * @param {string} epicId 
//    * @returns {Promise<{ success?: boolean; error?: string }>}
//    */
//   checkEpicIdExists: async (epicId: string): Promise<{ success?: boolean; error?: string }> => {
//     const discord = client as Client;
//     try {
//       const channel = discord.channels.cache.get(
//         config.discord.channels.epic_log
//       ) as TextChannel;

//       if (!channel) {
//         return { error: 'Epic log channel not found in Discord configuration.' };
//       }

//       const messages = await channel.messages.fetch();
//       const found = messages.find(({ content }) =>
//         content.includes(`Epic ID: ${epicId}`)
//       );

//       if (found) {
//         const discordId = found.content.split('Discord ID: ')[1]?.split(' ')[0];
//         return {
//           error: `Your Epic ID is already in use by (<@${discordId}>).`,
//         };
//       }

//       return { success: true };
//     } catch (error) {
//       console.error('Error during Epic ID existence check:', error);
//       return {
//         error: error.message || 'An error occurred while checking the Epic ID.',
//       };
//     }
//   },
};