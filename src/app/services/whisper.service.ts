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
  network: String = null;
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

  getNetwork(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.web3.eth.getBlock(0, (err: any, block: any) => {
        this.zone.run(() => {
          if (err) {
            return reject(err);
          } else {
            switch (block.hash) {
              case "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3":
                resolve("main")
                break;
              case "0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d":
                resolve("ropsten")
                break;
              default:
                reject("Unknown network");
            }
          }
        });
      })
    });
  }

  public prepare() {
    var external: any = ExternalWeb3;
    this.web3 = new external(new external.providers.HttpProvider("http://cubosybridas.cloudapp.net:443"));
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
                var message = new Message(JSON.parse(this.web3.toAscii(m.payload)));
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
                this.getNetwork().then(network => {
                  this.network = network;
                  return resolve(list);
                }).catch(err => { reject(err) })
              }
            }
          });
        });
      }
    });
  }

  public sendMessage(toSend: String): Promise<Message> {
    toSend = toSend.replace(/[^\x00-\x7F]/g, "");
    return new Promise((resolve, reject) => {
      var message = new Message({ sender: this.userAddresses[0], message: toSend });
      var payload = this.web3.fromAscii(JSON.stringify(message.toJson()));
      this.web3.shh.post({
        "from": this.identity,
        "topics": [this.TOPIC],
        "payload": payload,
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