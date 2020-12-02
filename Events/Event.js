const Event = require("events");
const EventEmitter = Event.EventEmitter;
const eventHandlers = require("./eventHandlers");

class EventManager extends EventEmitter {
  Emit(name, data) {
    this.emit(name, data);
  }
}
const globalEvent = new EventManager();

globalEvent.on("UserDeleted", eventHandlers.userDeleted);
globalEvent.on("BoardCreated", eventHandlers.boardCreated);
globalEvent.on("BoardDeleted", eventHandlers.boardDeleted);
globalEvent.on("AddMemberToBoard", eventHandlers.AddMemberToBoard);
globalEvent.on("RemoveMemberFromBoard", eventHandlers.RemoveMemberFromBoard);
globalEvent.on("ListCreated", eventHandlers.ListCreated);
globalEvent.on("ListDeleted", eventHandlers.ListDeleted);
globalEvent.on("CardCreated", eventHandlers.cardCreated);
globalEvent.on("CardDeleted", eventHandlers.cardDeleted);
globalEvent.on("MemberAddedToCard", eventHandlers.MemberAddedToCard);
globalEvent.on("MemberRemovedFromCard", eventHandlers.MemberRemovedFromCard);
globalEvent.on("CardTodoChecked", eventHandlers.CardTodoChecked);
globalEvent.on("CardTodoUnChecked", eventHandlers.CardTodoUnChecked);
globalEvent.on("CardTodoAdded", eventHandlers.CardTodoAdded);
globalEvent.on("CardTodoRemoved", eventHandlers.CardTodoRemoved);

module.exports = globalEvent;
