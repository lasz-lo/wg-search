const https = require('https');
const domino = require('domino');
const fs = require('fs');
const nodemailer = require('nodemailer');

var options = {
    host: 'www.ebay-kleinanzeigen.de',
    port: 443,
    path: '/s-haus-mieten/26135/c205l3110+haus_mieten.zimmer_d:5,'
};

https.get(options, function (res) {
    res.setEncoding('utf8');
    text = res.on('data', function (data) {
        fs.appendFileSync('page.temp', data);
    });
}).on('error', function (e) {
    console.log("Got error: " + e.message);
});
setTimeout(() => {
    let text = fs.readFileSync('page.temp', 'utf8');
    var window = domino.createWindow(text);
    var document = window.document;
    let items = document.getElementsByClassName('ad-list')[0].getElementsByClassName('aditem');
    if(!fs.existsSync('adids')) fs.writeFileSync('adids', "");
    var adids = fs.readFileSync('adids', 'utf8');
    let msg = "";
    for(let i = 0 ; i < items.length ; i++) {
        let adid;
        try {
            adid = items[i].attributes["data-adid"].data;
        } catch(e) {
            console.log("err");
        }
        if(!adids.includes(adid) && adid) {
            let links = items[i].querySelectorAll('a');
            for(let j = 0 ; j < links.length ; j++) {
                links[j].href = 'https://www.ebay-kleinanzeigen.de/'+links[j].href;
            }
            msg += items[i].innerHTML;
            console.log('not contained');
            fs.appendFileSync('adids', adid+"\n");
        } else {
            console.log('contained');
        }
    }
    if(msg) sendMail(msg);
    fs.unlinkSync('page.temp');
}, 500);


function sendMail(text) {
    var user = JSON.parse(fs.readFileSync('userauth.json'));

    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: user.auth
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"WG App" <eskalations.stosstrupp@gmail.com>', // sender address
        to: 'eskalations.stosstrupp@gmail.com', // list of receivers
        subject: 'Angebote', // Subject line
        text: '', // plain text body
        html: text // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
}