'use client';

import {useState, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {createUploadUrl, getAssetIdFromUpload} from '@/app/actions';
import {Loader2, StopCircle, Monitor} from 'lucide-react';

export default function ScreenRecorder () {
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const liveVideoRef = useRef<HTMLVideoElement>(null);

    const router = useRouter;

    const startRecording = async () => {
        try{
            //Step 1: Capture the screen
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });

            //Step 2: Capture the microphone
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
                video: false,
            });

            //Step 3: Store references for cleanup
            screenStreamRef.current = screenStream;
            micStreamRef.current = micStream;

            //Step 4: Merge the streams
            const combinedStream = new MediaStream([
                ...screenStream.getVideoTracks(),
                ...micStream.getAudioTracks(),
            ]);

            //Step 5: Show live preview
            if(liveVideoRef.current){
                liveVideoRef.current.srcObject = combinedStream;
            }

            //Step 6: Set up the recorder
            const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm; codecs=vp9'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            //Step 7: Collect chunks as they are recorded
            mediaRecorder.ondataavailable = (event) => {
                if(event.data.size > 0) chunksRef.current.push(event.data);
            };

            //Step 8: Handle recording completion
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {type: 'video/webm'});
                setMediaBlob(blob);

                if(liveVideoRef.current){
                    liveVideoRef.current.srcObject = null;
                }

                //Critical: Stop all tracks
                screenStreamRef.current?.getTracks().forEach(t => t.stop());
                micStreamRef.current?.getTracks().forEach(t => t.stop());
            }

            //Step 9: Start recording
            mediaRecorder.start();
            setIsRecording(true);
            
            //Step 10: Handle the native "Stop sharing" button
            screenStream.getVideoTracks()[0].onended = stopRecording;
        }catch (err) {
            console.error('Error starting recording:', err )
        }
    };
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording){
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }
    

}


