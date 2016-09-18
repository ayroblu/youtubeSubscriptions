import fs from 'fs'

class JsonDatabase{
  constructor(syncInterval, isMinified){ //recommend 1000
    this.filename = 'db.json'
    this.db = {}
    this.loadDb()
    this.isMinified = isMinified
    if (syncInterval){
      this.setAutoSync(syncInterval)
    }
  }
  setAutoSync(syncInterval){
    this.intervalId = setInterval(()=>{
      if (this.dataChanged){
        this.save()
        console.log('save made')
        this.dataChanged = false
      }
    }, syncInterval)
  }
  invalidateDb(){
    this.dataChanged = true
  }
  save(){
    fs.writeFile(__dirname + '/' + this.filename, JSON.stringify(this.db, null, this.isMinified ? null : 2), 'utf8', err=>{
      if (err){
        console.error(err)
      }
    })
  }
  loadDb(){
    try {
      this.db = JSON.parse(fs.readFileSync(__dirname + '/' + this.filename, 'utf8'))
    } catch(err) {
      console.log('file doesnt exist:', err)
      this.dataChanged = true
    }
  }
  getDb(){
    return this.db
  }
}
export default JsonDatabase
