const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const app = express();
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const port = 3000;

app.engine('.ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend/pages'));
app.use(express.static(__dirname + '/frontend/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(session({
    name: 'sessionid',
    secret: 'DWSis#1',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
}));
app.set('trust proxy', true);
app.use(cookieParser());
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    skip: (req, res) => {
        return req.ip !== undefined;
    },
    message: "Too many requests from this IP, please try again in a minute."
}));
app.use(async (req, res, next) => {
    if (!(await cmsdata()).ok) {
        res.status(500).render('error', { error: 'error connecting to CMS; CMS connection failed' });
        return;
    };
    next();
});

function cmsdata() {
    return fetch(`https://cms.dangoweb.com/:${process.env.SITE}/api/gql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': process.env.CMS_API_KEY,
        },
        body: JSON.stringify({
            query: `{
                siteDetails: content(model: "siteDetails")
                menu: content(model: "menu")
                events: content(model: "events")
            }`
        }),
    })
};

async function startApp() {
    try {
        var cms = JSON.parse(JSON.stringify((await cmsdata().then(res => res.json())).data).replaceAll('.spaces', 'clients'));
    } catch { };

    // Defaults & Environment Variables

    var defaults = {
        environment: process.env.NODE_ENV || 'testing',
        domain: process.env.NODE_ENV === 'production' ? cms.siteDetails[0]['domain-production'] : process.env.NODE_ENV === 'development' ? cms.siteDetails[0]['domain-development'] : '../../../../..',
        asset_prefix: process.env.CMS_ASSET_PREFIX,
        asset_url: process.env.CMS_ASSET_URL,
        slugify: function (str) { return String(str).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') }
    };

    // Functions

    async function allRoutes(req, res) {
        cms = (await cmsdata().then(res => res.json())).data;
        return;
    };

    Date.prototype.isToday = function () {
        const today = new Date()
        return this.getDate() === today.getDate() &&
            this.getMonth() === today.getMonth() &&
            this.getFullYear() === today.getFullYear()
    };

    // Routes

    app.get('/', async (req, res) => {
        await allRoutes(req, res);
        return res.render('index', { vars: defaults, title: '', cms });
    });

    app.get('/admin', async (req, res) => {
        res.redirect(`https://cms.dangoweb.com/:${process.env.SITE}`);
    });

    app.get('/robots.txt', function (req, res) {
        res.type('text/plain');
        res.send((defaults.environment === 'production') ? "User-agent: *\nAllow: /" : "User-agent: *\nDisallow: /");
    });

    app.use(async (req, res, next) => {
        await allRoutes(req, res);
        return res.render('404', { vars: defaults, title: '404', cms });
    });

    app.use(async (err, req, res, next) => {
        console.log(err);
        return res.render('error', { error: 'internal server error; check logs' });
    });

    app.listen(port, () => {
        try {
            console.log(`${cms.siteDetails[0].site} listening on port ${port}`);
        } catch {
            console.log(`${process.env.SITE} listening on port ${port}`);
        };
    });
};

startApp();