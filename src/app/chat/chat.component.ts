import { Component, OnInit, Input } from '@angular/core';
import { WhisperService, Message } from "../services/whisper.service";

declare var blockies;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.less']
})
export class ChatComponent implements OnInit {

  @Input() address: String;

  messages: Message[] = [];
  icons: String[] = [];

  newMessage: String = "";

  constructor(private whisperService: WhisperService) { }

  ngOnInit() {
    this.whisperService.messagesSubject.subscribe((message) => {
      if (message) {
        this.addMessage(message);
      }
    })
  }

  sendMessage() {
    this.whisperService.sendMessage(this.newMessage).then(message=>{
    if (message) {
      this.newMessage = "";
      this.addMessage(message);
    }});
  }

  addMessage(message: Message) {
    this.icons.unshift(blockies.create({ // All options are optional
      seed: message.sender, // seed used to generate icon data, default: random
    }).toDataURL());
    this.messages.unshift(message);
  }

}
