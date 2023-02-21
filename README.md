# Petition

## Online-petition against algorithmic bias

<a href="https://petition.andreashechler.com/" target="_blank">This petition</a> advocates for signing the Algo.Rules and against algorithmic bias.

Depending on whether users register and sign, they will be shown different pages by setting a session cookie. The data flow runs with GET and POST routes that have been tested with Supertest. The respective user profile can be edited conditionally; the data is stored in the database by inserts, updates, upserts and deletes. The signature is created with canvas. The site has a differentiated error-handling and is protected against SQL-injection, clickjacking, XSS- and CSRF-attacks.

<img src="/public/petition.gif" alt="gif to display how petition works">

**Tech Stack:** Node, Express handlebars, PostgreSQL, jQuery, CSS, HTML

**Features:** supporters can register, login, update their profile information, sign, unsign, view fellow signees sorted by location, logout

## License

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)
