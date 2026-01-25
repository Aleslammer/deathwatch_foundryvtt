const fs = require('fs');

// Read the template.json file
const template = JSON.parse(fs.readFileSync('src/template.json', 'utf8'));

// Add descriptor field to all skills
const skills = template.Actor.character.skills;
for (const skillKey in skills) {
    if (!skills[skillKey].hasOwnProperty('descriptor')) {
        skills[skillKey].descriptor = '';
    }
}

// Write back to file
fs.writeFileSync('src/template.json', JSON.stringify(template, null, 4));
console.log('Added descriptor field to all skills');