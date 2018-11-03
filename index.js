"use strict";

const fetch = require("node-fetch");
const inquirer = require("inquirer");
const Table = require("cli-table");

(async () => {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "isPublic",
      message:
        "This program takes data from public instagram pages. Make sure the page you are targeting is public",
      default: true,
    },
    {
      type: "input",
      name: "username",
      message:
        "What is the username? (This is what usually comes after https://www.instagram.com/)",
      default: "jroman1964",
    },
  ]);
  const options = {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36",
    },
    redirect: "manual",
  };
  fetch(`https://www.instagram.com/${answers.username}/`, options)
    .then(res => res.text())
    .then(body => {
      const dataRegExp = /window\._sharedData\s?=\s?(.*);</i;
      const jsonData = body.match(dataRegExp) ? body.match(dataRegExp)[1] : "{}";
      const data = JSON.parse(jsonData);
      if (data.entry_data) {
        const user = data.entry_data.ProfilePage[0].graphql.user;
        const userData = {
          id: user.id,
          username: user.username,
          name: user.full_name,
          bio: user.biography,
          followersNumber: user.edge_followed_by.count,
          followingNumber: user.edge_follow.count,
        };
        const postsData = user.edge_owner_to_timeline_media.edges.slice(0, 6);
        const userDataForTable = Object.keys(userData).map(key => ({
          [key]: userData[key],
        }));
        const table = new Table();
        table.push(...userDataForTable);
        table.push(
          ...postsData.map((post, index) => ({
            [`post ${index + 1}`]: `id: ${post.node.id}\nimage: ${
              post.node.display_url
            }`,
          })),
        );

        console.log(table.toString());
      } else {
        console.error(data);
      }
    });
})();

