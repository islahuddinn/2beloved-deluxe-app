const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const moment = require("moment");
const redis = require("redis");
const Notification = require("../models/notificationModel");
const RefreshToken = require("../models/refreshTokenModel");
const User = require("../models/userModel");
const {
  SendNotification,
  SendNotificationMultiCast,
  sendNotificationMultiCast,
} = require("../utils/notification");

const { sendNotification } = require("../utils/notification");

const OnlineUser = require("../models/onlineUserModel");
const { json } = require("body-parser");
const { JsonWebTokenError } = require("jsonwebtoken");
const { locationQuery } = require("./geoLocationQuery");
const io = require("socket.io")();

// const client = redis.createClient()
const client = {
  set: async (user) =>
    await OnlineUser.updateOne({ user }, {}, { upsert: true }),
  del: async (user) => await OnlineUser.deleteOne({ user }),
  flushDb: async () => await OnlineUser.deleteOne({}),
  KEYS: async () => {
    const keys = await OnlineUser.find({});
    const newKeys = [];
    for (const key of keys) newKeys.push(`${key.user}`);
    return newKeys;
  },
  connect: async () => null,
};

///////// User Promises
const userData = {};
const userSocketID = {};

setInterval(async () => {
  try {
    const promises = [];

    for (const userId in userData)
      if (userData[userId]) promises.push(userData[userId]());
    await Promise.all(promises);
  } catch (e) {
    console.log(e, "error catched while seting interval");
  }
}, 5 * 1000);
///////////////////////////

client.connect().then(async (_) => {
  await client.flushDb();

  const getOnlineUsers = async () => {
    const userIds = await client.KEYS();
    const users = await User.find({ _id: { $in: userIds } }).select("id");
    io.emit("online-users", {
      message: "Online Users Retrieved Successfully",
      success: true,
      data: { users },
    });
  };

  io.sockets.on("connect", async (socket) => {
    console.log(`Connected to ${socket.id}`);

    function getRoomJoinedSocketIds(roomName) {
      const room = io.in(roomName);
      const socketIds = Object.keys(room.sockets);
      return socketIds;
    }

    /// authenticate user
    const authenticated = (cb) => async (data) => {
      const user = await User.findOne({ _id: data.userId });
      console.log("**************** user id" + data.userId);
      console.log(user, "mr user");

      if (!user) {
        socket.emit({ message: "Unauthenticated", success: false, data: {} });
        return socket.disconnect();
      }
      await cb({ user: JSON.parse(JSON.stringify(user)), ...data });
    };
    //// user enter
    socket.on(
      "user-enter",
      authenticated(async ({ user }) => {
        console.log(`User enter Connected to ${socket.id}`);
        //////////// user info SUBSCRIBE
        const f = async () => {
          try {
            ///////// notifications
            const notifictations = await Notification.find({
              $or: [
                {
                  $and: [
                    { notifyType: { $ne: "sendMessage" } },
                    { receiver: user._id },
                    { actionTaken: false },
                  ],
                },
                {
                  $and: [
                    { notifyType: { $ne: "sendMessage" } },
                    { multireceiver: { $in: [user._id] } },
                    { isSeen: { $not: { $elemMatch: { $eq: user._id } } } },
                  ],
                },
              ],
            });
            // console.log(notifictations.length, notifictations.length, user);

            const sizenotif = notifictations.length;
            let action;
            sizenotif > 0 ? (action = false) : (action = true);
            ///////////////////////////////////
            ///////// Chat Count
            let messagescount = 0;
            let ChatRooms;
            ChatRooms = await Chat.find({ users: { $in: [user._id] } }).sort(
              "-updatedAt"
            );

            ChatRooms = JSON.parse(JSON.stringify(ChatRooms));

            for (let i = 0; i < ChatRooms.length; i++) {
              let dbMessages;
              if (ChatRooms[i].chatType === "single") {
                dbMessages = await Message.find({
                  $and: [
                    { messageType: "single" },
                    { chatId: ChatRooms[i]._id },
                    { seen: false },
                    { receiver: { $eq: user._id } },
                  ],
                });
              } else {
                dbMessages = await Message.find({
                  $and: [
                    { messageType: "group" },
                    { chatId: ChatRooms[i]._id },
                    { seenBy: { $not: { $elemMatch: { $eq: user._id } } } },
                  ],
                });
              }

              ChatRooms[i].newMessages = dbMessages.length;
              messagescount = messagescount + dbMessages.length;
            }
            ////////////////////////////////////////
            // socket.emit('info', {...sendingData})
            socket.join(user._id);
            io.to(user._id).emit("notification", {
              success: true,
              message: "Notification Retrieved Successfully",
              data: {
                action: action,
                messages: messagescount,
                notifictationSize: sizenotif,
              },
            });
          } catch (e) {
            console.log(e);
          }
        };
        await f();
        userData[`${user._id}`] = f;
        userSocketID[`${socket.id}`] = user._id;

        //////////// user info SUBSCRIBE-end
        console.log(user, user._id);
        socket.join(user._id);
        await client.set(user._id);
        await getOnlineUsers();
      })
    );
    //// user leave
    socket.on(
      "user-leave",
      authenticated(async ({ user }) => {
        // user info sub leave
        delete userData[`${user._id}`];
        /// user info sub leave
        await client.del(user._id);
        await getOnlineUsers();
        io.to(user._id).emit("leaving", {
          success: true,
          message: "Socket left",
        });
        socket.leave(user._id);
      })
    );
    // get online users
    socket.on(
      "get-online-users",
      authenticated(async () => {
        await getOnlineUsers();
      })
    );

    socket.on(
      "get-inboxes",
      authenticated(async ({ user }) => {
        /////////////////// Chat Room Find
        console.log(`Get Inboxes Connected to ${socket.id}`);
        console.log("USER IN GET-INBOXES:", user);
        console.log("USER ID IN GET-INBOXES", user.id);
        let ChatRooms;
        ChatRooms = await Chat.find({ users: { $in: [user.id] } }).sort(
          "-updatedAt"
        );
        // ChatRooms = await Chat.find({
        //   $and:[
        //     {users: {$in: [user.id]}},
        //     {chatType: "group"}
        //   ]
        // })
        console.log("CHAT ROOMS ARE:", ChatRooms);

        ChatRooms = JSON.parse(JSON.stringify(ChatRooms));

        for (let i = 0; i < ChatRooms.length; i++) {
          let dbMessages;
          if (ChatRooms[i].chatType === "single") {
            dbMessages = await Message.find({
              $and: [
                { messageType: "single" },
                { chatId: ChatRooms[i]._id },
                { seen: false },
                { receiver: { $eq: user._id } },
              ],
            });
          } else {
            dbMessages = await Message.find({
              $and: [
                { messageType: "group" },
                { chatId: ChatRooms[i]._id },
                { seenBy: { $not: { $elemMatch: { $eq: user._id } } } },
              ],
            });
          }
          ChatRooms[i].newMessages = dbMessages.length;
        }

        console.log("Rooms ==>", ChatRooms);

        if (ChatRooms.length < 1) {
          ChatRooms = null;
          io.to(user._id).emit("inboxes", {
            success: true,
            message: "Inbox Retrieved Succcessfully",
            // data: { inboxes: [...inboxes], },
            inboxes: [],
          });
        } else {
          // socket.join(user._id);
          io.to(user._id).emit("inboxes", {
            success: true,
            message: "Inbox Retrieved Succcessfully",
            // data: { inboxes: [...inboxes], },
            inboxes: [...ChatRooms],
          });
        }
      })
    );

    socket.on(
      "join-room",
      authenticated(async ({ user, inbox }) => {
        console.log("SELFID--->> ", user._id, "NEXTUSERID---->", inbox);
        console.log("USER ID IN SOCKET MEMORY ---->", userSocketID[socket.id]);
        let ChatRoom;
        ///////////// Receiver
        const receiveruser = await User.findById(inbox);
        //////////////
        //////////// Chat Room Find
        ChatRoom = await Chat.findOne({
          $and: [{ users: user._id }, { users: inbox }],
        });

        if (!ChatRoom) {
          return io.to(user._id).emit("messages", {
            success: false,
            message: "Messages Retrieved Successfully",
            receiver: receiveruser,
            act: "chat-not-exist",
            messages: [],
          });
        }
        ////////////////////////
        const updatedMessages = await Message.updateMany(
          { sender: inbox, receiver: user._id },
          { seen: true }
        );
        // console.log("updated msgs", updatedMessages);
        let messages;
        messages = await Message.find({
          $and: [
            {
              $or: [{ sender: user._id }, { receiver: user._id }],
            },
            {
              $or: [{ sender: inbox }, { receiver: inbox }],
            },
          ],
        })
          .populate("sender")
          .populate("receiver")
          .populate("post")
          .sort({ createdAt: -1 });

        //////////// MSGS Filtering
        messages = JSON.parse(JSON.stringify(messages));
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].seen === false) {
            console.log("Test 1");
            if (messages[i].sender._id === user._id) {
              console.log("Test 2");
              messages[i].seen = true;
            }
          }
        }
        // .populate("receiver")
        // .populate("sender");
        const chatId = ChatRoom._id.toString();
        // socket.join(user._id);
        console.log("Room id:", chatId);
        socket.join(chatId);
        io.to(user._id).emit("messages", {
          success: true,
          message: "Messages Retrieved Successfully",
          receiver: receiveruser,
          messages: [...messages],
        });
      })
    );
    socket.on(
      "leave-room",
      authenticated(async ({ user, inbox }) => {
        console.log("SELFID--->> ", user._id, "NEXTUSERID---->", inbox);
        let ChatRoom;
        //////////// Chat Room Find
        ChatRoom = await Chat.findOne({
          $and: [{ users: user._id }, { users: inbox }],
        });
        ////////////////////////

        const chatId = ChatRoom._id.toString();
        console.log("Room id:", chatId);
        socket.leave(chatId);
        io.to(user._id).emit("leaving", {
          success: true,
          message: "Room left",
        });
      })
    );
    socket.on(
      "send-message",
      authenticated(
        async ({ user, to, message, messageType, audioLength, postId }) => {
          try {
            ///////////time
            // Get current date in UTC
            // Get current local time
            const currentLocalTime = moment();

            ///////////// Receiver
            const receiveruser = await User.findById(to);
            //////////////

            // Convert local time to UTC
            // const currentUtcTime = currentLocalTime.utc().utcOffset(1);

            // Convert UTC time to Unix timestamp
            const currentUnixTime = currentLocalTime.unix();

            console.log("Current Local Time:", currentLocalTime);
            // console.log("Current UTC Time:", currentUtcTime);
            console.log("Current Unix Timestamp:", currentUnixTime);
            ///////// time

            console.log("innnnn send msg start Startttttttttt");
            const receiver = await User.findOne({ _id: to });

            ///////////////// Room update
            let chat;
            if (messageType === "post") {
              message = `shared post`;
            }
            chat = await Chat.findOne({
              $and: [{ users: user._id }, { users: to }],
            });
            const userr1 = to;
            const user2 = user._id;
            if (!chat) {
              const users = [userr1, user2];
              // console.log(users);
              chat = await Chat.create({
                users: users,
                lastMsgSender: user2,
                LastMessage: message,
                messageTime: currentUnixTime,
                type: messageType,
              });
              const chatId1 = chat._id.toString();
              socket.join(chatId1);
            } else {
              await Chat.findByIdAndUpdate(chat.id, {
                lastMsgSender: user2,
                LastMessage: message,
                messageTime: currentUnixTime,
                type: messageType,
              });
            }
            ///////////////// Room Login
            const chatId = chat._id.toString();
            console.log("Room id in send:", chatId);
            // socket.join(chatId);
            const joinedPeople = io.sockets.adapter.rooms.get(chatId);
            console.log("Room People:", joinedPeople);
            // console.log("Room People v2:", getRoomJoinedSocketIds(chatId));
            const joinedPeopleCount = joinedPeople ? joinedPeople.size : 0;

            //////////////////////

            ///////// create msg logic
            const dbMessage = await Message.create({
              chatId: chat._id,
              sender: user._id,
              receiver: to,
              message,
              post: postId,
              messageTime: currentUnixTime,
              audioLength: audioLength,
              seen: joinedPeopleCount > 1 ? true : false,
              type: messageType,
            });

            await Chat.findByIdAndUpdate(chat.id, {
              lastMessageId: dbMessage._id,
            });

            const currentmessage = await Message.findById(dbMessage?._id)
              .populate("sender")
              .populate("receiver")
              .populate("post");

            const messages = await Message.find({
              $and: [
                {
                  $or: [{ sender: user._id }, { receiver: user._id }],
                },
                {
                  $or: [{ sender: to }, { receiver: to }],
                },
              ],
            })
              .populate("sender")
              .populate("receiver")
              .populate("post")
              .sort({ createdAt: -1 });

            //////////// Notify

            ///////////////////
            // await sendNotification({
            //   type: "sendMessage",
            //   sender: user,
            //   receiver,
            //   title: "sent message",
            //   deviceToken: receiver.deviceToken,
            //   body: `${user.name} sent you a message`,
            // });

            io.to(chatId).emit("messages", {
              success: true,
              message: "Messages Retrieved Successfully",
              receiver: receiveruser,
              messages: [currentmessage],
            });

            if (joinedPeopleCount < 2) {
              const tokens = [];
              const notificationData = [];
              const user1 = await User.findById(to);

              const userTokens = JSON.parse(
                JSON.stringify(await RefreshToken.find({ user: user1?.id }))
              ).map(({ deviceToken }) => deviceToken);

              if (user1.isNotification && userTokens.length > 0) {
                tokens.push(...userTokens);
                // notificationData.push({ ...user1 });
                if (tokens.length > 0) {
                  // console.log(tokens, user._id, user.name);
                  await sendNotificationMultiCast({
                    tokens: tokens,
                    sender: user._id,
                    type: "sendMessage",
                    title: "New Message",
                    body: `${user.name} sent you a message`,
                    data: {
                      value: JSON.stringify(user),
                    },
                  });
                }
              }

              ////////////// Receiver Logic

              let ChatRooms;
              ChatRooms = await Chat.find({ users: { $in: [to] } }).sort(
                "-updatedAt"
              );
              // .limit(1);

              ChatRooms = JSON.parse(JSON.stringify(ChatRooms));

              for (let i = 0; i < ChatRooms.length; i++) {
                const dbMessages = await Message.find({
                  $and: [
                    { chatId: ChatRooms[i]._id },
                    { seen: false },
                    { receiver: { $eq: to } },
                  ],
                });

                ChatRooms[i].newMessages = dbMessages.length;
              }
              console.log("Rooms ==>", ChatRooms);

              if (ChatRooms.length < 1) {
                ChatRooms = null;
              }
              // socket.join(user._id);
              io.to(to).emit("inboxes", {
                success: true,
                message: "Inbox Retrieved Succcessfully",
                // data: { inboxes: [...inboxes], },
                inboxes: [...ChatRooms],
              });
            }
            // io.emit("new-message", {
            //   success: true,
            //   message: "Messages Found Successfully",
            //   data: { message: dbMessage },
            // });
          } catch (error) {
            console.log(error);
          }
        }
      )
    );

    //////////Group

    socket.on(
      "create-group",
      authenticated(
        async ({ user, members, groupName, groupDescription, groupPhoto }) => {
          console.log("LISTENTING TO CREATE-GROUP EVENT:");
          console.log("GROUP USER IS:", user);
          console.log("GROUP USER ID IS:", user.id);
          console.log("GROUP MEMBERS ARE:", members);
          console.log("GROUP NAME IS:", groupName);
          console.log("GROUP DESCRIPTION IS:", groupDescription);
          console.log("GROUP PHOTO IS:", groupPhoto);
          ///////////time
          // Get current date in UTC
          // Get current local time
          const currentLocalTime = moment();
          //////////////

          // Convert local time to UTC
          // const currentUtcTime = currentLocalTime.utc().utcOffset(1);

          // Convert UTC time to Unix timestamp
          const currentUnixTime = currentLocalTime.unix();

          console.log("Current Local Time:", currentLocalTime);
          // console.log("Current UTC Time:", currentUtcTime);
          console.log("Current Unix Timestamp:", currentUnixTime);
          ///////// time
          ///////////////// Room update
          let chat;
          const message = "Group Created";
          // console.log(users);
          chat = await Chat.create({
            chatType: "group",
            groupName: groupName,
            groupPhoto,
            groupDescription: groupDescription,
            users: members,
            groupOwner: user.id,
            lastMsgSender: user.id,
            LastMessage: message,
            // seenBy: user.id,
            messageTime: currentUnixTime,
            type: "alert",
          });

          console.log("GROUP CHAT CREATED:", chat);
          const chatId1 = chat._id.toString();
          socket.join(chatId1);
          ///////////////// Room Login
          console.log("Room id in send:", chatId1);
          //////////////////////
          ///////// create msg logic
          const dbMessage = await Message.create({
            messageType: "group",
            chatId: chat._id,
            sender: user._id,
            // receiver: to,
            message,
            messageTime: currentUnixTime,
            seenBy: user.id,
            type: "alert",
          });

          await Chat.findByIdAndUpdate(chat.id, {
            lastMessageId: dbMessage._id,
          });

          const currentmessage = await Message.findById(
            dbMessage?._id
          ).populate("sender");

          io.to(chatId1).emit("group-messages", {
            success: true,
            message: "Group Created Successfully",
            // receiver: receiveruser,
            messages: [currentmessage],
          });

          ///////////////////////
          const tokens = [];
          const user1 = await User.find({ _id: { $in: members } });

          for (let i = 0; i < user1.length; i++) {
            const userTokens = JSON.parse(
              JSON.stringify(await RefreshToken.find({ user: user1[i]?.id }))
            ).map(({ deviceToken }) => deviceToken);

            if (user1[i].isNotification && userTokens.length > 0) {
              tokens.push(...userTokens);
            }
          }
          if (tokens.length > 0) {
            await sendNotificationMultiCast({
              tokens: tokens,
              sender: user._id,
              type: "groupMessage",
              title: "New Message",
              body: `${user?.name} added you in a group ${groupName}`,
              data: {
                value: JSON.stringify(user),
              },
            });
          }

          ///////////////////////////
        }
      )
    );

    socket.on(
      "join-group-room",
      authenticated(async ({ user, inbox }) => {
        // console.log("SELFID--->> ", user._id, "NEXTUSERID---->", inbox);
        console.log("USER ID IN SOCKET MEMORY ---->", userSocketID[socket.id]);
        console.log("USER IN JOIN_GROUP_ROOM IS:", user);
        console.log("GROUP_CHAT_ID IS", inbox);
        let ChatRoom;
        ///////////// Receiver
        // const receiveruser = await User.findById(inbox);
        //////////////
        //////////// Chat Room Find
        ChatRoom = await Chat.findOne({
          $and: [{ chatType: "group" }, { _id: inbox }],
        });

        console.log("CHATROOM FOUND IS:", ChatRoom);

        if (!ChatRoom) {
          console.log("LOGGING CHAT ROOM NOT FOUND");
          return io.to(user._id).emit("group-messages", {
            success: false,
            message: "Messages Retrieved Successfully",
            act: "chat-not-exist",
            messages: [],
          });
        }
        ////////////////////////

        let messages;
        messages = await Message.find({
          $and: [
            {
              chatId: ChatRoom._id,
            },
          ],
        })
          .populate("sender")
          .sort({ createdAt: -1 });

        console.log("MESSAGES IN GROUP CHAT ARE:", messages);

        const updatedMessages = await Message.updateMany(
          {
            chatId: ChatRoom._id,
            seenBy: { $not: { $elemMatch: { $eq: user._id } } },
          },
          { $push: { seenBy: user._id } }
        );
        // console.log("updated msgs", updatedMessages);

        //////////// MSGS Filtering
        messages = JSON.parse(JSON.stringify(messages));
        for (let i = 0; i < messages.length; i++) {
          console.log("Test 1");
          if (messages[i].seenBy.includes(user.id)) {
            console.log("Test 2");
            messages[i].seen = true;
          }
        }
        // .populate("receiver")
        // .populate("sender");
        const chatId = ChatRoom._id.toString();
        // socket.join(user._id);
        console.log("Room id:", chatId);
        socket.join(chatId);

        let joinedPeople = io.sockets.adapter.rooms.get(chatId);
        let socketIds = [];
        let userIds = [];
        if (joinedPeople) {
          // The room exists, and you can get the socket IDs
          socketIds = Array.from(joinedPeople);
          console.log("Socket IDs in room:", socketIds);
          socketIds.map((socket123) => {
            console.log("Socket", socket123);
            console.log("UserId", userSocketID[socket123]);
            userIds.push(userSocketID[socket123]);
          });
        }
        console.log("user array:", userIds);
        // joinedPeople = Object.keys(joinedPeople);
        console.log("Room People:", joinedPeople);
        // io.to(chatId1).emit("group-messages", {
        //   success: true,
        //   message: "Group Created Successfully",
        //   // receiver: receiveruser,
        //   messages: [currentmessage],
        // });

        io.to(user._id).emit("group-messages", {
          success: true,
          message: "Messages Retrieved Successfully",
          messages: [...messages],
        });
      })
    );

    socket.on(
      "leave-group-room",
      authenticated(async ({ user, inbox }) => {
        console.log("SELFID--->> ", user._id, "NEXTUSERID---->", inbox);
        let ChatRoom;
        //////////// Chat Room Find
        ChatRoom = await Chat.findOne({
          $and: [{ _id: inbox }],
        });
        ////////////////////////

        const chatId = ChatRoom._id.toString();
        console.log("Room id:", chatId);
        socket.leave(chatId);
        io.to(user._id).emit("leaving", {
          success: true,
          message: "Group Room left",
        });
      })
    );

    socket.on(
      "add-group-members",
      authenticated(async ({ user, inbox, members }) => {
        console.log("SELFID--->> ", user._id, "NEXTUSERID---->", inbox);
        let ChatRoom;
        //////////// Chat Room Find
        ChatRoom = await Chat.findOneAndUpdate(
          {
            $and: [{ _id: inbox }],
          },
          { $push: { users: members } }
        );
        ////////////////////////

        const chatId = ChatRoom._id.toString();
        console.log("Room id:", chatId);
        socket.leave(chatId);
        io.to(user._id).emit("members-added-group", {
          success: true,
          message: "Members Added",
        });
      })
    );

    socket.on(
      "leave-group",
      authenticated(async ({ user, inbox }) => {
        console.log("USER ID IS:",user._id)
        console.log("CHAT ID IS:", inbox)
        let ChatRoom;
        //////////// Chat Room Find
        ChatRoom = await Chat.findOneAndUpdate(
          {
            $and: [{ _id: inbox }],
          },
          { $pull: { users: user._id } }
        );
        ////////////////////////

        const chatId = ChatRoom._id.toString();
        console.log("Room id:", chatId);
        socket.leave(chatId);
        console.log("GROUP OWNER ID IS:", ChatRoom.groupOwner._id.toString());
        console.log("ID OF USER WHO IS LEAVING:", user._id.toString());
        if (ChatRoom.groupOwner._id.toString() === user._id.toString()) {
          console.log("MAKING NEW GROUP ADMIN");
          const newOwner = ChatRoom.users[0]._id;
          ChatRoom.groupOwner = newOwner;

          await ChatRoom.save();
        }

        if(ChatRoom.users.length <= 0){
          await Chat.findByIdAndDelete(inbox)
        }

        io.to(user._id).emit("leaving-group", {
          success: true,
          message: "Group left",
        });
      })
    );

    socket.on(
      "send-message-group",
      authenticated(
        async ({ user, to, message, messageType, audioLength, postId }) => {
          try {
            ///////////time
            // Get current date in UTC
            // Get current local time
            const currentLocalTime = moment();

            ///////////// Receiver
            const receiveruser = await User.findById(to);
            //////////////

            // Convert local time to UTC
            // const currentUtcTime = currentLocalTime.utc().utcOffset(1);

            // Convert UTC time to Unix timestamp
            const currentUnixTime = currentLocalTime.unix();

            console.log("Current Local Time:", currentLocalTime);
            // console.log("Current UTC Time:", currentUtcTime);
            console.log("Current Unix Timestamp:", currentUnixTime);
            ///////// time

            console.log("innnnn send msg start Startttttttttt");

            ///////////////// Room update
            let chat;
            if (messageType === "post") {
              message = `shared post`;
            }

            chat = await Chat.findOne({
              $and: [{ users: user._id }, { _id: to }],
            });
            // console.log("CHAT ROOOOOOOOM", chat);
            const user2 = user._id;
            await Chat.findByIdAndUpdate(chat.id, {
              lastMsgSender: user2,
              LastMessage: message,
              messageTime: currentUnixTime,
              type: messageType,
            });

            ///////////////// Room Login
            const chatId = chat._id.toString();
            console.log("Room id in send:", chatId);
            // socket.join(chatId);
            let joinedPeople = io.sockets.adapter.rooms.get(chatId);
            // joinedPeople = Object.keys(joinedPeople);
            console.log("Room People:", joinedPeople);
            // console.log("Room People v2:", getRoomJoinedSocketIds(chatId));
            let socketIds = [];
            let userIds = [];
            if (joinedPeople) {
              // The room exists, and you can get the socket IDs
              socketIds = Array.from(joinedPeople);
              console.log("Socket IDs in room:", socketIds);
              socketIds.map((socket123) => {
                console.log("Socket", socket123);
                console.log("UserId", userSocketID[socket123]);
                userIds.push(userSocketID[socket123]);
              });
            }
            console.log("user array:", userIds);

            let notificationUsers = chat?.users?.filter(
              (user) => !userIds.includes(user?.id)
            );
            notificationUsers = notificationUsers.map((user) => user.id);

            //////////////////////

            ///////// create msg logic
            const dbMessage = await Message.create({
              messageType: "group",
              chatId: chat._id,
              sender: user._id,
              message,
              post: postId,
              messageTime: currentUnixTime,
              seen: false,
              seenBy: userIds,
              audioLength: audioLength,
              type: messageType,
            });

            await Chat.findByIdAndUpdate(chat.id, {
              lastMessageId: dbMessage._id,
            });

            const currentmessage = await Message.findById(dbMessage?._id)
              .populate("sender")
              .populate("post");

            // const messages = await Message.find({
            //   $and: [
            //     {
            //       $or: [{ sender: user._id }, { receiver: user._id }],
            //     },
            //     {
            //       $or: [{ sender: to }, { receiver: to }],
            //     },
            //   ],
            // })
            //   .populate("sender")
            //   .populate("receiver")
            //   .sort({ createdAt: -1 });

            io.to(chatId).emit("group-messages", {
              success: true,
              message: "Messages Retrieved Successfully",
              joinedPeople,
              messages: [currentmessage],
            });
            // console.log("Ttoal Notifcation Users", notificationUsers);
            if (notificationUsers.length > 0) {
              const tokens = [];
              const notificationData = [];
              const user1 = await User.find({
                _id: { $in: notificationUsers },
              });

              for (let i = 0; i < user1.length; i++) {
                const userTokens = JSON.parse(
                  JSON.stringify(
                    await RefreshToken.find({ user: user1[i]?.id })
                  )
                ).map(({ deviceToken }) => deviceToken);

                if (user1[i].isNotification && userTokens.length > 0) {
                  tokens.push(...userTokens);
                }
              }
              // console.log("In Send Notifications Token", tokens);
              if (tokens.length > 0) {
                await sendNotificationMultiCast({
                  tokens: tokens,
                  sender: user._id,
                  type: "groupMessage",
                  title: "New Message",
                  body: `${user?.name}  sent message in a group ${chat?.groupName}`,
                  data: {
                    value: JSON.stringify(user),
                  },
                });
              }

              //   ////////////// Receiver Logic
              await Promise.all(
                notificationUsers.map(async (headuser) => {
                  // console.log("In Promise");
                  let ChatRooms;
                  ChatRooms = await Chat.find({
                    users: { $in: [headuser] },
                  }).sort("-updatedAt");
                  // .limit(1);

                  ChatRooms = JSON.parse(JSON.stringify(ChatRooms));

                  for (let i = 0; i < ChatRooms.length; i++) {
                    let dbMessages;
                    if (ChatRooms[i].chatType === "single") {
                      dbMessages = await Message.find({
                        $and: [
                          { messageType: "single" },
                          { chatId: ChatRooms[i]._id },
                          { seen: false },
                          { receiver: { $eq: headuser } },
                        ],
                      });
                    } else {
                      dbMessages = await Message.find({
                        $and: [
                          { messageType: "group" },
                          { chatId: ChatRooms[i]._id },
                          {
                            seenBy: { $not: { $elemMatch: { $eq: headuser } } },
                          },
                        ],
                      });
                    }

                    ChatRooms[i].newMessages = dbMessages.length;
                  }
                  // console.log("Rooms ==>", ChatRooms);

                  if (ChatRooms.length < 1) {
                    ChatRooms = null;
                  }
                  // socket.join(user._id);
                  io.to(headuser).emit("inboxes", {
                    success: true,
                    message: "Inbox Retrieved Succcessfully",
                    // data: { inboxes: [...inboxes], },
                    inboxes: [...ChatRooms],
                  });
                })
              );
            }
            // io.emit("new-message", {
            //   success: true,
            //   message: "Messages Found Successfully",
            //   data: { message: dbMessage },
            // });
          } catch (error) {
            console.log(error);
          }
        }
      )
    );

    /////////// Broad Cast
    socket.on(
      "join-broadcast",
      authenticated(async ({ user, location }) => {
        try {
          const messages = await Message.find({
            $and: [
              { messageType: { $eq: "broadcast" } },
              {
                location: locationQuery(
                  location?.coordinates[0],
                  location?.coordinates[1],
                  4
                ),
              },
            ],
          })
            .populate("sender")
            .sort({ createdAt: -1 });

          io.to(user?.id).emit("broadcast-messages", {
            success: true,
            message: "Messages Retrieved Successfully",
            messages: [...messages],
          });
        } catch (error) {
          console.log(error);
        }
      })
    );

    socket.on(
      "send-message-broadcast",
      authenticated(
        async ({ user, location, message, messageType, audioLength }) => {
          try {
            ///////////time
            // Get current date in UTC
            const currentLocalTime = moment();
            //////////////
            const currentUnixTime = currentLocalTime.unix();
            console.log("innnnn send msg start Startttttttttt");
            ///////// create msg logic
            const dbMessage = await Message.create({
              messageType: "broadcast",
              sender: user._id,
              message,
              audioLength: audioLength,
              messageTime: currentUnixTime,
              // seen: joinedPeopleCount > 1 ? true : false,
              type: messageType,
              location,
            });
            const currentmessage = await Message.findById(
              dbMessage?._id
            ).populate("sender");

            io.to(user?.id).emit("broadcast-messages", {
              success: true,
              message: "Messages Retrieved Successfully",
              messages: [currentmessage],
            });

            const users = await User.find({
              $and: [
                {
                  location: locationQuery(
                    currentmessage?.location?.coordinates[0],
                    currentmessage?.location?.coordinates[1],
                    4
                  ),
                },
                { _id: { $ne: user?._id } },
              ],
            });

            await Promise.all(
              users.map(async (user1) => {
                io.to(user1?.id).emit("broadcast-messages", {
                  success: true,
                  message: "Messages Retrieved Successfully",
                  messages: [currentmessage],
                });
              })
            );

            if (users.length > 0) {
              const tokens = [];

              for (let i = 0; i < users.length; i++) {
                const userTokens = JSON.parse(
                  JSON.stringify(
                    await RefreshToken.find({ user: users[i]?.id })
                  )
                ).map(({ deviceToken }) => deviceToken);

                if (users[i].isNotification && userTokens.length > 0) {
                  tokens.push(...userTokens);
                }
              }
              if (tokens.length > 0) {
                await sendNotificationMultiCast({
                  tokens: tokens,
                  sender: user._id,
                  type: "broadCastMessage",
                  title: "New Message",
                  body: `${user?.name} sent message in a broadcast`,
                  data: {
                    value: JSON.stringify(user),
                  },
                });
              }
            }
          } catch (error) {
            console.log(error);
          }
        }
      )
    );

    //////////////// Delete Message
    socket.on(
      "delete-message",
      authenticated(async ({ user, messageId }) => {
        console.log("SELFID--->> ", user._id, "messageId---->", messageId);
        const message = await Message.findById(messageId);
        const chat = await Chat.findById(message.chatId);
        await Message.findByIdAndDelete(messageId);
        const chatId = chat._id.toString();
        io.to(chatId).emit("message-delete", {
          success: true,
          messageId,
          message: "Message Deleted",
        });

        if (
          chat.lastMessageId.toString() === messageId &&
          message.messageType !== "broadcast"
        ) {
          const latestMessage = await Message.find({ chatId: chat._id })
            .sort("-createdAt")
            .limit(1);
          if (latestMessage.length > 0) {
            await Chat.findByIdAndUpdate(
              chat.id,
              {
                lastMsgSender: latestMessage.sender,
                LastMessage: latestMessage.message,
                lastMessageId: latestMessage.lastMessageId,
                messageTime: latestMessage.createdAt,
                type: latestMessage.type,
              },
              { new: true }
            );
          } else {
            await Chat.findByIdAndDelete(chat._id);
          }

          ///////////heads update
          await Promise.all(
            chat.users.map(async (headuser) => {
              // console.log("In Promise");
              let ChatRooms;
              ChatRooms = await Chat.find({
                users: { $in: [headuser._id] },
              }).sort("-updatedAt");
              // .limit(1);

              ChatRooms = JSON.parse(JSON.stringify(ChatRooms));

              for (let i = 0; i < ChatRooms.length; i++) {
                let dbMessages;
                if (ChatRooms[i].chatType === "single") {
                  dbMessages = await Message.find({
                    $and: [
                      { messageType: "single" },
                      { chatId: ChatRooms[i]._id },
                      { seen: false },
                      { receiver: { $eq: headuser._id } },
                    ],
                  });
                } else {
                  dbMessages = await Message.find({
                    $and: [
                      { messageType: "group" },
                      { chatId: ChatRooms[i]._id },
                      {
                        seenBy: { $not: { $elemMatch: { $eq: headuser._id } } },
                      },
                    ],
                  });
                }

                ChatRooms[i].newMessages = dbMessages.length;
              }
              // console.log("Rooms ==>", ChatRooms);

              if (ChatRooms.length < 1) {
                ChatRooms = null;
              }
              // socket.join(user._id);
              io.to(headuser._id).emit("inboxes", {
                success: true,
                message: "Inbox Retrieved Succcessfully",
                // data: { inboxes: [...inboxes], },
                inboxes: [...ChatRooms],
              });
            })
          );
        }
      })
    );

    socket.on("disconnect", async () => {
      console.log("User disconnected: ", socket.id);
      if (userSocketID[socket.id]) {
        await client.del(userSocketID[socket.id]);
        await getOnlineUsers();
        delete userSocketID[`${socket.id}`];
        if (userData[`${userSocketID[socket.id]}`]) {
          delete userData[`${userSocketID[socket.id]}`];
        }
      }
    });
  });
});

module.exports = { io };
