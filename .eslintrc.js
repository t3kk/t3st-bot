module.exports = {
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module"
  },
  "extends": "google",
  "rules":{
    "linebreak-style": 0,
    "max-len": [ "WARN", {
      "code": 90,
      "ignoreComments": true
    }]
  }
};
