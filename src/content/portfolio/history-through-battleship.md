---
title: History Through Battleship
publishDate: 2021-04-25 00:00:00
img: /src/assets/images//history-through-battleship.png
img_alt: History Through Battleship banner over an ocean background
description: |
  A full-stack application developed for a course at CU Boulder. I worked alongside 4 other students to create a trivia battleship game.
tags:
  - Full-stack
  - Express
  - PostgreSQL
---

## Description
A full-stack web app built using [express.js](https://expressjs.com/).

On the backend, History through Battleship utilizes a Postgres database to keep track of user’s usernames, passwords, and stats. This database is updated as new users register. Similarly, users stats are updated as trivia questions are answered correctly and incorrectly. Furthermore, History Through Battleship connects to the Trivia DB API and retrieves the trivia questions seen within the game. These questions could be changed to other subjects as well.

## About the game
History Through Battleship is an educational web-game developed to test and refine students’ history skills. The application, which features both single player and local multiplayer, runs similarly to your typical battleship game. However, the game has a fresh educational twist that is meant to offer practical use. When launching a missile, a user must successfully answer a trivia question. If the user incorrectly answers their question, they lose their turn.

Within the single player game mode, the user plays against an intelligent AI system that can launch missiles based on previous hits/misses. This competitive system can be a hard match for even the smartest history buff. The local multiplayer mode is played between two users on the same system. Once player 1 has placed his/her ships, they pass their turn to player 2 who will do the same. When both players’ ships have been placed, they can start the game. The users will then alternate turns by clicking the “End Turn” button at the bottom of the screen.


[View on GitHub](https://github.com/kaischuygon/history-through-battleship)