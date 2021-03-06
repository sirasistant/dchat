import { Injectable, NgZone } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { Http, Headers, Response, URLSearchParams } from "@angular/http";
import * as ExternalWeb3 from "../../../node_modules/web3/index.js";

import 'rxjs/add/operator/toPromise';

declare var window;


@Injectable()
export class WhisperService {
  TOPIC = "dbank-workshop-topic-test";

  web3: any = null;
  injectedWeb3: any = null;

  userAddresses: String[] = [];
  connectionSubject = new BehaviorSubject<ConnectionStatus>(null);
  identity: any;


  messagesSubject = new BehaviorSubject<Message>(null);

  constructor(private _http: Http, private zone: NgZone) {
  }

  parseBytes(hex: String): number[] {
    var bytes: number[] = [];
    for (var i = 2; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  public prepare() {
    var external: any = ExternalWeb3;
    this.web3 = new external(new external.providers.HttpProvider("https://shh.assistantindustries.es:443"));
    this.injectedWeb3 = window.web3;
    if (this.web3 && this.injectedWeb3) {
      this.init().then(userAccounts => {
        this.web3.shh.newIdentity((err, result) => {
          if (err)
            return this.connectionSubject.next(new ConnectionStatus(false, err));
          this.identity = result;
          this.userAddresses = userAccounts;
          var broadcastWatch = this.web3.shh.filter({ "topics": [this.web3.fromAscii(this.TOPIC)] });
          broadcastWatch.watch((err, m) => {
            if (m.from != this.identity) {
              try {
                var message = new Message(JSON.parse(this.hexDecode(m.payload)));
                this.zone.run(() => {
                  this.messagesSubject.next(message);
                });
              } catch (e) {
              }
            }
          });
          this.connectionSubject.next(new ConnectionStatus(true, null))
        });
      }).catch(error => this.connectionSubject.next(new ConnectionStatus(false, error)));
    } else {
      this.connectionSubject.next(new ConnectionStatus(false, "No web3"))
    }
  }

  private init(): Promise<String[]> {
    return new Promise<String[]>((resolve, reject) => {
      if (!this.injectedWeb3) {
        return reject("No web3");
      } else {
        this.injectedWeb3.eth.getAccounts((err: any, list: string[]) => {
          this.zone.run(() => {
            if (err) {
              return reject(err);
            } else {
              if (list.length == 0) {
                return reject("No address")
              } else {
                  return resolve(list);
              }
            }
          });
        });
      }
    });
  }

  public sendMessage(toSend: String): Promise<Message> {
    return new Promise((resolve, reject) => {
      var message = new Message({ sender: this.userAddresses[0], message: toSend });
      this.web3.shh.post({
        "from": this.identity,
        "topics": [this.TOPIC],
        "payload": this.hexEncode(JSON.stringify(message)),
        "ttl": 100
      }, (err, data) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          resolve(message);
        });
      })
    });
  }

  hexEncode(toEncode: string) {
    var hex, i;

    var result = "0x";
    for (i = 0; i < toEncode.length; i++) {
      hex = toEncode.charCodeAt(i).toString(16);
      result += ("000" + hex).slice(-4);
    }

    return result
  }

  hexDecode(hex: string) {
    hex = hex.substring(2,hex.length);
    var j;
    var hexes = hex.match(/.{1,4}/g) || [];
    var back = "";
    for (j = 0; j < hexes.length; j++) {
      back += String.fromCharCode(parseInt(hexes[j], 16));
    }
    return back;
  }

}



export class ConnectionStatus {
  connected: boolean;
  error: any;

  constructor(connected: boolean, error: any) {
    this.connected = connected;
    this.error = error;
  }
}

export class Message {
  sender: string;
  message: string;

  constructor(json: any) {
    this.sender = json.sender;
    this.message = json.message;
  }

  toJson(): any {
    return { sender: this.sender, message: this.message };
  }
}