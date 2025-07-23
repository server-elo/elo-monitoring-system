import { useState, useRef, useCallback } from 'react';

export interface WebRTCState {
  isConnected: boolean;
  localStream?: MediaStream;
  remoteStreams: MediaStream[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export const useWebRTC = () => {
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    remoteStreams: [],
    isAudioEnabled: false,
    isVideoEnabled: false,
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const initializeConnection = useCallback(async (): Promise<void> => {
    try {
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      setState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
    }
  }, []);

  const startLocalStream = useCallback(async (video = false, audio = true): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setState(prev => ({
        ...prev,
        localStream: stream,
        isAudioEnabled: audio,
        isVideoEnabled: video,
      }));
    } catch (error) {
      console.error('Failed to start local stream:', error);
    }
  }, []);

  const stopLocalStream = useCallback((): void => {
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
      setState(prev => ({
        ...prev,
        localStream: undefined,
        isAudioEnabled: false,
        isVideoEnabled: false,
      }));
    }
  }, [state.localStream]);

  const toggleAudio = useCallback((): void => {
    if (state.localStream) {
      const audioTracks = state.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
    }
  }, [state.localStream]);

  const toggleVideo = useCallback((): void => {
    if (state.localStream) {
      const videoTracks = state.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
    }
  }, [state.localStream]);

  const disconnect = useCallback((): void => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    stopLocalStream();
    setState({
      isConnected: false,
      remoteStreams: [],
      isAudioEnabled: false,
      isVideoEnabled: false,
    });
  }, [stopLocalStream]);

  return {
    ...state,
    initializeConnection,
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
    disconnect,
  };
};