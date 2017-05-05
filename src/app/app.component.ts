import { Component, Inject, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { DOCUMENT } from "@angular/platform-browser";
import { NgForm } from '@angular/forms';
import { WhisperService,ConnectionStatus } from './services/whisper.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent {
    width = 0;
    account: String;

    constructor(private whisperService: WhisperService) { }


    ngAfterViewInit() {
        this.proccessConnection(this.whisperService.connectionSubject.getValue());
        this.whisperService.connectionSubject.subscribe((connection) => this.proccessConnection(connection))
    }

    onWindowLoad() {
        this.whisperService.prepare();
    }

    proccessConnection(status: ConnectionStatus) {
        if (status && status.connected) {
            this.account = this.whisperService.userAddresses[0];
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.width = event.target.innerWidth;
    }
}
