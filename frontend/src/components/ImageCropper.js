import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import getCroppedImg from '../utils/cropImage';
import './ImageCropper.css';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="cropper-modal-overlay">
            <div className="cropper-modal-container">
                <div className="cropper-header">
                    <h3>Crop Image</h3>
                    <button className="close-btn" onClick={onCancel}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="cropper-wrapper">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        showGrid={true}
                    />
                </div>

                <div className="cropper-controls">
                    <div className="zoom-control">
                        <FontAwesomeIcon icon={faMinus} className="zoom-icon" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="zoom-slider"
                        />
                        <FontAwesomeIcon icon={faPlus} className="zoom-icon" />
                    </div>

                    <div className="cropper-actions">
                        <button className="btn-cancel" onClick={onCancel}>
                            Cancel
                        </button>
                        <button className="btn-save" onClick={handleSave}>
                            <FontAwesomeIcon icon={faCheck} />
                            Save Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
