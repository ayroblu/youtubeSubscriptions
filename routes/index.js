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
  const playlistManager = new PlaylistManager()
  const mySubscriptions = subs.get()
  const playlists = playlistManager.get()
  // okay, at this point, loop over and group if channel is equal
  let groupedSubscriptions = []
  let prev
  for (let sub of mySubscriptions){
    if (prev && prev.length && prev[0].channelId === sub.channelId){
      prev.push(sub)
      continue
    }
    prev = [sub]
    groupedSubscriptions.push(prev)
    // logic: if channel === prev.channel prev.append
    // else group.push
  }
  res.render('index', {
    title: 'YouTube Playlist Manager'
  , subscriptions: groupedSubscriptions.slice(0, 50)
  , playlist: playlists[0]
  });
}
router.get('/', home);

class Subscriptions{
  constructor(){
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
class PlaylistManager{
  constructor(){
    this.db = new JsonDatabase(2000)
  }
  get(){
    let db = this.db.getDb()
    return Object.keys(db.playlistItems).map(k=>db.playlistItems[k].map(i=>i.snippet))
  }
  add(item){
  }
  remove(item){
  }
  move(item){
  }
}

module.exports = router;
