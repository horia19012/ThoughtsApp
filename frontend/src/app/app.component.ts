import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'thoughts-app';
  visualizerBars: number[] = [];
  particleCount = 50;

  ngOnInit() {
    // Generate array for visualizer bars
    this.visualizerBars = Array.from({length: 20}, (_, i) => i + 1);
  }
}
