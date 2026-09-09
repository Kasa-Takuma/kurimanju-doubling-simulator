import './style.css';
import { App, showCompatibilityScreen } from './app/App';
import { isWebGPUSupported } from './renderer/Renderer';

const root = document.getElementById('app');
if (!root) {
  throw new Error('アプリケーションルートが見つかりません');
}

if (!isWebGPUSupported()) {
  showCompatibilityScreen(root);
} else {
  void new App(root).start();
}
