import { TestBed, inject } from '@angular/core/testing';

import { WhisperService } from './whisper.service';

describe('ContractService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WhisperService]
    });
  });

  it('should ...', inject([WhisperService], (service: WhisperService) => {
    expect(service).toBeTruthy();
  }));
});
