import request from 'request'
import JsonDatabase from './db'
import "babel-polyfill"
import _ from 'lodash'
 
function encodeParams(params){
  return '?' + Object.keys(params).map(k=>k+'='+encodeURIComponent(params[k])).join('&')
}
 
//request(options, callback);
class GoogleAuth{
  constructor(keys){
    this.secret = {
      client_id: keys.client_id
    , redirect_uri: keys.redirect_uri
    }
    this.client_secret = {
      client_secret: keys.client_secret
    }
  }
  authUrl(){
    var params = Object.assign({},this.secret,{
      scope: 'https://www.googleapis.com/auth/youtube'
    , response_type: 'code'
    , access_type: 'offline'
    })
    return 'https://accounts.google.com/o/oauth2/auth' + encodeParams(params)
  }
  authToken(code){
    var params = Object.assign({}, this.secret, this.client_secret, {
      code: code
    , redirect_uri: 'http://localhost:4444/oauth2callback'
    , grant_type: 'authorization_code'
    })
    return new Promise((resolve, reject)=>{
      request.post('https://accounts.google.com/o/oauth2/token', {form: params}, function(error, response, body){
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          return resolve(info)
        }
        console.log('Bad request:', response.statusCode)
        reject(error ? error : new Error('Bad request:', response.statusCode))
      })
    })
  }
}
class YoutubeApi extends GoogleAuth{
  constructor(keys){
    super(keys)
    this.apikey = keys.apikey
  }
  setAccessToken(accessToken){
    this.accessToken = accessToken
  }
  handleRequest(url, params){
    if (!this.accessToken){
      throw new Error('No Access Token')
    }
    var allParams = Object.assign({}, params, {key: this.apikey})
    var options = {
      url: url + encodeParams(allParams)
    , headers: {
        'Authorization': 'Bearer ' + this.accessToken
      }
    }
    return new Promise((resolve, reject)=>{
      request(options, (error, response, body)=>{
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          return resolve(info)
        }
        if (error){
          reject(error)
        } else {
          console.log('Bad status:', response.statusCode, '\n' + body)
          reject()
        }
      })
    })
  }
  getSubscriptions(params){
    return this.handleRequest('https://www.googleapis.com/youtube/v3/subscriptions', params)
  }
  getChannel(params){
    return this.handleRequest('https://www.googleapis.com/youtube/v3/channels', params)
  }
  getPlaylistItem(params){
    return this.handleRequest('https://www.googleapis.com/youtube/v3/playlistItems', params)
  }
}
class Runner{
  constructor(keys){
    this.yt = new YoutubeApi(keys)
    this.db = new JsonDatabase(2000)
    this.dbSetup()
  }
  userAuth(oauthCode){
    return this.yt.authToken(oauthCode).then(res=>{
      var db = this.db.getDb()
      db.auths = res
      this.yt.setAccessToken(res.access_token)
      this.db.invalidateDb()
      console.log(res)
      return res
    }).catch(err=>{
      console.error('Autherror:', err)
      console.log('Go to:\n', this.yt.authUrl())
    })
  }
  runAuthed(oauthCode, callback){
    if (!oauthCode){
      return console.log('Please enter in an oauth code from:\n', this.yt.authUrl())
    }
    console.log('Run called:', oauthCode)
    var db = this.db.getDb()
    if (db.auths && db.auths.access_token){
      console.log('Authenticated! Your method will now run')
      callback()
    } else {
      this.userAuth(oauthCode).then(res=>{
        if (res){
          this.runAuthed(oauthCode, callback)
        }
      })
    }
  }
  run(oauthCode){
    this.runAuthed(oauthCode, ()=>{
      console.log('Please enter a method here')
    })
  }
  clean(){
    var db = this.db.getDb()
    Object.assign(db, {
      subscriptions: {
        items: []
      }
    , auths: {}
    })
    this.db.invalidateDb()
  }
  dbSetup(){
    var db = this.db.getDb()
    if (!db.subscriptions){
      Object.assign(db, {
        subscriptions: {
          items: []
        }
      , auths: {}
      })
      this.db.invalidateDb()
    }
  }
}
class SubscriptionsRunner extends Runner{
  constructor(keys){
    super(keys)
  }
  async getSubscriptions(){
    var params = {
      part: 'snippet'
    , maxResults: '50'
    , mine: 'true'
    }

    var db = this.db.getDb()
    var count = 0
    while(db.subscriptions.items.length === 0 || params.pageToken){
      var subdata = await this.yt.getSubscriptions(params)
      Object.assign(db, {
        subscriptions: {
          items: db.subscriptions.items.concat(subdata.items)
        }
      })
      params.pageToken = subdata.nextPageToken
      if (count > subdata.pageInfo.totalResults){
        console.log('Infinite loop?', count, '>', subdata.pageInfo.totalResults)
      }
      count += subdata.pageInfo.resultsPerPage
    }
    this.db.invalidateDb()
    return db.subscriptions.items
  }
  run(oauthCode){
    this.runAuthed(oauthCode, ()=>{
      let db = this.db.getDb()
      this.getSubscriptions().then(res=>{
        console.log('got subscriptions!', res)
        if (!res){
          return console.log('Failed to get subscriptions!')
        }
        console.log('Number of subscriptions:', db.subscriptions.items.length)
      }).catch(err=>{
        if (!err){
          console.log('Catch, no err')
          return
        }
        console.error('Error getting subscriptions:', err)
        db.auths = null
        this.db.invalidateDb()
        this.run(oauthCode)
      })
    })
  }
}
class PlaylistIdsRunner extends Runner{
  constructor(keys){
    super(keys)
  }
  async getPlaylistIds(){
    let db = this.db.getDb()
    let channelIds = db.subscriptions.items.map(i=>i.snippet.resourceId.channelId)
    channelIds = _.chunk(channelIds, 50)
    //channelIds = Array.from(new Set(channelIds)).slice(0, 20)
    let params = {
      part: 'contentDetails'
    , maxResults: '50'
    }
    let uploads = []
    for (let channelId of channelIds){
      console.log('id:', channelId.join(','))
      params.id = channelId.join(',')
      let channels = await this.yt.getChannel(params)
      uploads = uploads.concat(channels.items)
    }
    console.log(JSON.stringify(uploads, null, 2))
    let uploadIds = uploads.map(item=>item.contentDetails.relatedPlaylists.uploads)
    Object.assign(db, {uploadIds})
    this.db.invalidateDb()
    return uploadIds
  }
  run(oauthCode){
    this.runAuthed(oauthCode, ()=>{
      let db = this.db.getDb()
      this.getPlaylistIds().then(res=>{
        console.log('got playlistIds!', res)
      }).catch(err=>{
        if (!err){
          console.log('Catch, no err')
          return
        }
        console.error('Error getting playlistIds:', err)
        db.auths = null
        this.db.invalidateDb()
        this.run(oauthCode)
      })
    })
  }
}
class VideosRunner extends Runner{
  constructor(keys){
    super(keys)
  }
  async getVideos(){
    var db = this.db.getDb()
    let params = {
      part: 'snippet'
    , maxResults: '10'
    }
    let videos = await Promise.all(db.uploadIds.map(id=>{
      return this.yt.getPlaylistItem(Object.assign({playlistId: id}, params))
    }))
    // fully overwrite here
    videos = _.flatten(videos)
    db.videos = videos.reduce((o, v, i)=>{
      o[db.uploadIds[i]] = v
      return o
    }, {})
    this.db.invalidateDb()
    return videos
  }
  run(oauthCode){
    this.runAuthed(oauthCode, ()=>{
      let db = this.db.getDb()
      this.getVideos().then(res=>{
        console.log('Got Videos!', res.length)
      }).catch(err=>{
        if (!err){
          console.log('Catch, no err')
          return
        }
        console.error('Error getting Videos:', err)
        db.auths = null
        this.db.invalidateDb()
        this.run(oauthCode)
      })
    })
  }
}
var keys = {
  client_id: '702858083566-456c5iteit5u9pc6otim6gc1iojkealb.apps.googleusercontent.com'
, redirect_uri: 'http://localhost:4444/oauth2callback'
, client_secret: 'WCHHC9w-lCX-5oteLUswoju_'
, apikey: 'AIzaSyBXmZNipaD0TBNTACXJRKsjHyDFECezQOk'
}
function runGettingSubscribers(oauthCode){
  const runner = new SubscriptionsRunner(keys)
  console.log('length:', runner.db.getDb().subscriptions.items.length)
  //runner.clean()
  runner.run(oauthCode)
}
function runGetPlaylistIds(oauthCode){
  const runner = new PlaylistIdsRunner(keys)
  runner.run(oauthCode)
}
function runGetVideos(oauthCode){
  // So remember that we want timely data so either cache or ditch all
  // for each subscription
  // getplaylistid for uploads
  // while loop for getting all videos for that channel before a date
  const runner = new VideosRunner(keys)
  runner.run(oauthCode)
}
function run(oauthCode){
  //runGettingSubscribers(oauthCode)
  //runGetPlaylistIds(oauthCode)
  //runGetVideos(oauthCode)
}
run('4/_3bgPjWS4TFTNhPfZe1Dj0RiPuFiQB5Hm-42_cZ2PHA')
// steps:
// 1. AuthUrl
// 2. AuthToken
// 3. Run
