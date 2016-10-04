console.log('script run')

class PlaylistManager{
  constructor(listEl){
    this.listEl = listEl
    this.events = []
    this.height = 80
    this.setEvents()
  }
  setEvents(){
    let listItems = Array.from(this.listEl.querySelectorAll('li'))
    this.clearStyles(listItems)
    listItems.forEach((l,i)=>this.setDragEvent(l, i, listItems))
  }
  setDragEvent(listItem, idx, listItems){
    let position = null
    listItem.onmousedown = e=>{
      position = {x: e.pageX, y: e.pageY}
      listItem.style.zIndex = 1
      listItem.style.boxShadow = '0 0 10px #888'
    }
    let reqId
    let mouseMove = e=>{
      if (!position){
        return
      }
      // list
      let x = e.pageX - position.x, y = e.pageY - position.y
      listItem.style.transform = `translateY(${y}px)`
      reqId = requestAnimationFrame(()=>this.adjustListItems(listItems, idx))
    }
    let mouseUp = e=>{
      if (position){
        cancelAnimationFrame(reqId)
        let i = this.getCurrentIndex(listItems, idx)
        this.clearStyles(listItems)
        if (i !== idx){
          this.move(listItems, idx, i)
          this.boxes = null
          this.removeEvents()
          this.setEvents()
        } else {
          console.log('equal', i, idx)
        }
      }
      position = null
    }
    document.addEventListener('mousemove', mouseMove)
    document.addEventListener('mouseup', mouseUp)
    this.events.push({
      key: 'mousemove', func: mouseMove
    })
    this.events.push({
      key: 'mouseup', func: mouseUp
    })
  }
  clearStyles(listItems){
    listItems.forEach(listItem=>{
      listItem.style.transform = null
      listItem.style.zIndex = null
      listItem.style.boxShadow = null
      console.log(listItem)
    })
  }
  removeEvents(){
    this.events.forEach(e=>document.removeEventListener(e.key, e.func))
    this.events = []
  }
  setBoxes(listItems){
    this.boxes = listItems.map(l=>l.getBoundingClientRect())
  }
  adjustListItems(listItems, idx){
    if (!this.boxes || this.boxes.length !== listItems.length){
      this.setBoxes(listItems)
    }
    let boxes = this.boxes
    let currentBox = listItems[idx].getBoundingClientRect()
    for (let i = 0; i < idx; ++i){
      if (boxes[i].top + this.height/2 > currentBox.top){
        listItems[i].style.transform = `translateY(80px)`
      } else {
        listItems[i].style.transform = null
      }
    }
    for (let i = idx + 1; i < listItems.length; ++i){
      if (boxes[i].top - this.height/2 < currentBox.top){
        listItems[i].style.transform = `translateY(-${this.height}px)`
      } else {
        listItems[i].style.transform = null
      }
    }
  }
  getCurrentIndex(listItems, idx){
    if (!this.boxes || this.boxes.length !== listItems.length){
      this.setBoxes(listItems)
    }
    let boxes = this.boxes
    let currentBox = listItems[idx].getBoundingClientRect()
    for (let i = 0; i < idx; ++i){
      if (boxes[i].top + this.height/2 > currentBox.top){
        return i
      } else {
      }
    }
    if (currentBox.top < boxes[idx].top + this.height/2 && currentBox.top > boxes[idx].top - this.height/2){
      return idx
    }
    for (let i = idx + 1; i < listItems.length; ++i){
      if (boxes[i].top - this.height/2 < currentBox.top){
      } else {
        listItems[i].style.transform = null
        return i
      }
    }
  }
  move(listItems, preIdx, postIdx){
    listItems[preIdx].parentElement.insertBefore(listItems[preIdx], listItems[postIdx])
  }
}

function run(){
  console.log('run started')
  let listEl = document.querySelector('.items')
  if (!listEl)
    return console.log('no listel?')
  let playlistManager = new PlaylistManager(listEl)
}
run()
