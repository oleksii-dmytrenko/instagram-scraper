"use strict";

const fetch = require("node-fetch");
const inquirer = require("inquirer");
const Table = require("cli-table");

const POSTS_NUMBER = 6;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36";

(async () => {
  const answers = await inquirer.prompt(questions());
  const options = {
    method: "GET",
    headers: { "User-Agent": USER_AGENT },
    redirect: "manual",
  };
  fetch(`https://www.instagram.com/${answers.username}/`, options)
    .then(res => res.text())
    .then(body => {
      const [error, data] = extractData(body);
      if (error) throw error;
      processData(...data);
    })
    .catch(console.error);
})();

function extractData(body) {
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
    const postsData = user.edge_owner_to_timeline_media.edges.slice(
      0,
      POSTS_NUMBER,
    );

    return [null, [userData, postsData]];
  }

  return [new Error("Can not find any data, please make sure this profile exists."), [{}, {}]];
}

function processData(userData, postsData) {
  const table = new Table();
  table.push(
    ...Object.keys(userData).map(key => ({
      [key]: userData[key],
    })),
  );
  table.push(
    ...postsData.map((post, index) => ({
      [`post ${index + 1}`]: `id: ${post.node.id}\nimage: ${
        post.node.display_url
      }`,
    })),
  );

  console.log(table.toString());
}

function questions() {
  return [
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
  ];
}
