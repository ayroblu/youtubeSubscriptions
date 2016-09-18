import express from 'express'
let router = express.Router()
import JsonDatabase from '../api/db'
import _ from 'lodash'

/* GET home page. */
let home = function(req, res, next) {
  // Steps:
  // 1. Pull db.videos[key].items.snippet.publishedAt, title, description, thumbnails.default, channelTitle
  // 2. Create list of videos
  // 3. Send list to view
  const subs = new Subscriptions()
  const mySubscriptions = subs.get()
  res.render('index', { title: 'YouTube Playlist Manager', subscriptions: mySubscriptions });
}
router.get('/', home);

class Subscriptions{
  constructor(){
    console.log(JsonDatabase)
    this.db = new JsonDatabase(2000)
  }
  get(){
    let db = this.db.getDb()
    return _.flatten(Object.keys(db.videos)
      .map(k=>db.videos[k].items.map(i=>i.snippet)))
      .sort((a, b)=>{
        // actually iso dates are ordered...
        let dateA = new Date(a.publishedAt), dateB = new Date(b.publishedAt)
        if (dateA < dateB){
          return 1
        } else if (dateB < dateA) {
          return -1
        } else {
          return 0
        }
        //a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0
      }) // descending order
  }
}

module.exports = router;
