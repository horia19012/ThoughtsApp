import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import {VoiceMessageService} from '../../services/voice-message.service';


@Component({
  selector: 'app-voice-message',
  standalone: false,
  templateUrl: './voice-message.component.html',
  styleUrls: ['./voice-message.component.css']
})
export class VoiceMessageComponent implements OnDestroy, AfterViewInit {
  @Output() messageRecorded = new EventEmitter<Blob>();
  @Output() messageSent = new EventEmitter<Blob>();
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('waveformCanvas') waveformCanvas!: ElementRef<HTMLCanvasElement>;

  isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  isRecording = false;
  isRecorded = false;
  isPlaying = false;
  recordingTime = 0;
  currentTime = 0;
  duration = 0;
  progressPercentage = 0;
  private animationFrameId: number | null = null;
  errorMessage = '';

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  audioBlob: Blob | null = null;
  audioUrl: string | null = null;
  private recordingInterval: any;
  private progressInterval: any;

  private audioBuffer: AudioBuffer | null = null;
  private audioCtx: AudioContext | null = null;

  hasUploadedThisHour: boolean = false;

  constructor(private voiceService: VoiceMessageService, private cdr: ChangeDetectorRef) {
    if (!this.isSupported) {
      this.errorMessage = 'Voice recording is not supported in your browser';
    }

    const currentUserId = localStorage.getItem('user_id') || 'anonymous';

    this.voiceService.hadRecordedThisHour(currentUserId).subscribe({
      next: (exists) => {
        if (exists) {
          this.hasUploadedThisHour = exists;
          console.log('User has audio uploaded today');
        } else {
          console.log('No audio uploaded today');
        }
      },
      error: (err) => {
        console.error('Failed to check audio', err);
      }
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.cleanup();
  }

  async toggleRecording() {
    if (!this.isSupported) return;
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.recordingTime = 0;

      this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
      this.mediaRecorder.onstop = async () => {
        this.audioBlob = new Blob(this.audioChunks, {type: 'audio/wav'});
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.isRecorded = true;
        this.messageRecorded.emit(this.audioBlob);

        await this.decodeAudio();
        stream.getTracks().forEach(track => track.stop());
        this.setupAudioPlayer();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingInterval = setInterval(() => this.recordingTime++, 1000);
    } catch (err) {
      this.errorMessage = 'Failed to access microphone. Check permissions.';
      console.error(err);
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.recordingInterval);
    }
  }

  private setupAudioPlayer() {
    const audio = this.audioPlayerRef.nativeElement;
    if (!audio || !this.audioUrl) return;

    audio.src = this.audioUrl;
    audio.load(); // Start loading

    // Metadata loaded
    audio.onloadedmetadata = () => {
      this.duration = audio.duration;
      this.currentTime = 0;
      this.progressPercentage = 0;
      this.drawWaveform();
    };

    // Time updates
    audio.ontimeupdate = () => {
      this.currentTime = audio.currentTime;
      this.progressPercentage = (this.currentTime / this.duration) * 100;
      this.drawWaveform();
    };

    audio.onended = () => {
      this.isPlaying = false;
      this.currentTime = 0;
      this.progressPercentage = 0;
      this.stopWaveformAnimation();
      this.drawWaveform();
    };

    // When audio is ready, mark it ready to play
    audio.oncanplaythrough = () => {
      this.isRecorded = true; // enable play button only when fully ready
    };
  };

  private async waitForAudioReady(): Promise<void> {
    const audio = this.audioPlayerRef.nativeElement;
    if (!audio) return;

    // Already ready to play
    if (audio.readyState >= 4) return;

    return new Promise(resolve => {
      const onReady = () => {
        audio.removeEventListener('canplaythrough', onReady);
        resolve();
      };
      audio.addEventListener('canplaythrough', onReady);
    });
  }


  async togglePlayback() {
    const audio = this.audioPlayerRef.nativeElement;

    if (!audio || !this.audioBlob || !this.audioUrl) {
      return;
    }

    // Wait until audio is fully loaded
    await this.waitForAudioReady();

    if (this.isPlaying) {
      audio.pause();
      this.isPlaying = false;
      this.stopWaveformAnimation();
    } else {
      try {
        await audio.play();
        this.isPlaying = true;
        this.startWaveformAnimation();
      } catch (err) {
        console.error('Error playing audio:', err);
        this.errorMessage = 'Error playing audio';
      }
    }
  }


  private startWaveformAnimation() {
    const audio = this.audioPlayerRef.nativeElement;
    const loop = () => {
      if (!audio) return;
      this.currentTime = audio.currentTime;
      this.drawWaveform();
      if (this.isPlaying) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };
    loop();
  }

  private stopWaveformAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  seekAudio(event: MouseEvent) {
    console.log('=== SEEK AUDIO CALLED ===');

    const audio = this.audioPlayerRef.nativeElement;
    const canvas = this.waveformCanvas.nativeElement;

    if (!audio || !canvas) {
      console.log('Missing elements:', {audio: !!audio, canvas: !!canvas});
      return;
    }

    // Check if audio is ready for seeking
    if (!isFinite(audio.duration) || audio.duration === 0 || audio.readyState < 2) {
      console.log('Audio not ready for seeking:', {
        duration: audio.duration,
        readyState: audio.readyState,
        isRecorded: this.isRecorded
      });
      return;
    }

    // Get precise canvas position
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    console.log('Click details:', {
      clientX: event.clientX,
      rectLeft: rect.left,
      clickX: clickX,
      canvasWidth: rect.width
    });

    // Validate click is within canvas
    if (clickX < 0 || clickX > rect.width) {
      console.log('Click outside bounds');
      return;
    }

    // Calculate seek position
    const clickPercentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = clickPercentage * audio.duration;

    console.log('Seeking:', {
      percentage: (clickPercentage * 100).toFixed(1) + '%',
      newTime: newTime.toFixed(2),
      duration: audio.duration.toFixed(2)
    });

    // Pause during seek if playing
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      audio.pause();
      this.isPlaying = false;
      this.stopWaveformAnimation();
    }

    // Set new time
    audio.currentTime = newTime;
    this.currentTime = newTime;
    this.progressPercentage = clickPercentage * 100;

    // Resume playback if it was playing
    if (wasPlaying) {
      setTimeout(() => {
        audio.play().then(() => {
          this.isPlaying = true;
          this.startWaveformAnimation();
        }).catch(err => console.error('Error resuming playback:', err));
      }, 50); // Small delay to ensure seek completes
    } else {
      // Force redraw if not playing
      this.drawWaveform();
    }

    console.log('Seek completed');
  }

  deleteRecording() {
    this.cleanup();
    this.resetState();
    this.clearWaveform();
  }

  sendMessage() {
    if (!this.audioBlob) return;

    const currentUserId = localStorage.getItem('user_id') || 'anonymous';

    this.voiceService.uploadVoiceMessage(this.audioBlob).subscribe({
      next: res => {
        console.log('Uploaded successfully', res);

        // Check if the user has uploaded in the last hour
        this.voiceService.hadRecordedThisHour(currentUserId).subscribe({
          next: (exists) => {
            this.hasUploadedThisHour = exists;
            this.cdr.detectChanges();
            if (exists) {
              console.log('User has uploaded a message in the last hour');
            } else {
              console.log('User has not uploaded in the last hour');
            }
          },
          error: (err) => {
            console.error('Failed to check last hour upload', err);
          }
        });

      },
      error: err => console.error('Upload error', err)
    });

    this.deleteRecording();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private resetState() {
    this.isRecording = false;
    this.isRecorded = false;
    this.isPlaying = false;
    this.recordingTime = 0;
    this.currentTime = 0;
    this.duration = 0;
    this.progressPercentage = 0;
    this.audioBlob = null;
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    this.audioUrl = null;
    this.audioBuffer = null;
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  private cleanup() {
    clearInterval(this.recordingInterval);
    clearInterval(this.progressInterval);
    this.stopWaveformAnimation();

    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }

  private async decodeAudio() {
    if (!this.audioBlob) return;

    try {
      // Close existing context if any
      if (this.audioCtx) {
        await this.audioCtx.close();
      }

      this.audioCtx = new AudioContext();
      const arrayBuffer = await this.audioBlob.arrayBuffer();

      // Safe decode
      this.audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        this.audioCtx!.decodeAudioData(
          arrayBuffer,
          (buffer) => resolve(buffer),
          (error) => reject(error)
        );
      });

      console.log('Audio decoded successfully:', {
        duration: this.audioBuffer.duration,
        sampleRate: this.audioBuffer.sampleRate,
        channels: this.audioBuffer.numberOfChannels
      });

      this.drawWaveform();
    } catch (error) {
      console.error('Error decoding audio:', error);
      this.errorMessage = 'Error processing audio';
    }
  }


  private drawWaveform() {
    if (!this.waveformCanvas || !this.audioBuffer) return;

    const canvas = this.waveformCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const channelData = this.audioBuffer.getChannelData(0);
    const playProgress = this.duration > 0 ? this.currentTime / this.duration : 0;
    const playX = playProgress * width;

    // Calculate samples per pixel for better waveform representation
    const samplesPerPixel = channelData.length / width;

    // Draw waveform bars
    for (let x = 0; x < width; x++) {
      const startSample = Math.floor(x * samplesPerPixel);
      const endSample = Math.floor((x + 1) * samplesPerPixel);

      let min = 1.0, max = -1.0;
      for (let i = startSample; i < endSample && i < channelData.length; i++) {
        const sample = channelData[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      const amplitude = Math.max(Math.abs(min), Math.abs(max));
      const barHeight = Math.max(2, amplitude * height * 0.8);
      const y = (height - barHeight) / 2;

      // Color based on playback progress
      if (x < playX) {
        ctx.fillStyle = '#00ffea'; // Played portion - bright green
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // Unplayed portion
      }

      ctx.fillRect(x, y, 1, barHeight);
    }

    // Draw playhead
    if (this.duration > 0) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, height);
      ctx.stroke();

      // Playhead circle
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(playX, 8, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private clearWaveform() {
    if (!this.waveformCanvas) return;
    const canvas = this.waveformCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  nextUserAudio() {
    const currentUserId = localStorage.getItem('user_id') || 'anonymous';

    this.voiceService.getNextAudio(currentUserId).subscribe({
      next: async (result: { audioUrl: string; userId: string; messageId: string }) => {
        if (!result) {
          this.errorMessage = '✅ You have listened to all available messages for today.';
          this.audioBlob = null;
          this.audioUrl = null;
          this.isRecorded = false;
          return;
        }

        const response = await fetch(result.audioUrl);
        this.audioBlob = await response.blob();

        if (this.audioUrl) {
          URL.revokeObjectURL(this.audioUrl);
        }
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.isRecorded = true;
        this.setupAudioPlayer();
        this.errorMessage = '';

        if (this.audioBlob) {
          await this.decodeAudio();
        }
      },
      error: (err) => {
        console.error('Failed to fetch next user audio', err);
        this.errorMessage = 'Failed to load next user audio.';
      }
    });
  }
}
