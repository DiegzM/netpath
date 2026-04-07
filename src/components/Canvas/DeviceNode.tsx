import React, { useCallback } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { DeviceIcon }     from '../UI/DeviceIcon';
import { useDrag }        from './hooks/useDrag';
import type { Device }    from '../../types/device';
import styles from './NetworkCanvas.module.css';

const CIRCLE_R = 31;

interface DeviceNodeProps {
  device:       Device;
  isDrawSource: boolean;
  isWiring:     boolean;
  onNodeClick:  (deviceId: string) => void;
}

export const DeviceNode: React.FC<DeviceNodeProps> = ({
  device, isDrawSource, isWiring, onNodeClick,
}) => {
  const {
    removeDevice, selectedDeviceId, selectedIds,
    toggleSelectId,
  } = useCanvasStore();

  const isSelected      = selectedDeviceId === device.id;
  const isMultiSelected = selectedIds.has(device.id);
  const anySelected     = isSelected || isMultiSelected;

  const handleClick     = useCallback(() => onNodeClick(device.id), [device.id, onNodeClick]);
  const handleMouseDown = useDrag(device.id, handleClick);

  function handleMouseDownFull(e: React.MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();

    const df = useCanvasStore.getState().drawingFrom;

    // Wire in progress → complete it immediately
    if (df && df !== device.id) {
      onNodeClick(device.id);
      return;
    }

    // Shift+click → toggle multiselect, no drag/wire
    if (e.shiftKey) {
      e.preventDefault();
      toggleSelectId(device.id);
      return;
    }

    handleMouseDown(e);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (selectedIds.size > 1 && selectedIds.has(device.id)) {
      useCanvasStore.getState().removeSelected();
    } else {
      removeDevice(device.id);
    }
  }

  return (
    <div
      className={`${styles.node}
        ${isSelected                ? styles.nodeSelected      : ''}
        ${isMultiSelected           ? styles.nodeMultiSelected  : ''}
        ${isDrawSource              ? styles.nodeDrawSource     : ''}
        ${isWiring && !isDrawSource ? styles.nodeDrawTarget     : ''}`}
      style={{ left: device.x - CIRCLE_R, top: device.y - CIRCLE_R }}
      onMouseDown={handleMouseDownFull}
    >
      {(isSelected || isMultiSelected) && <div className={styles.pulse} />}

      <div className={styles.circle}>
        <DeviceIcon
          kind={device.kind} size={34}
          color={isDrawSource ? '#f6ad55' : anySelected ? '#fff' : '#4fd1c5'}
        />
      </div>

      <span className={styles.label}>{device.label}</span>
      {device.config.ip && <span className={styles.ip}>{device.config.ip}</span>}

      {anySelected && (
        <div
          className={styles.deleteBadge}
          title="Delete (⌫)"
          onMouseDown={handleDeleteClick}
        >
          ✕
        </div>
      )}
    </div>
  );
};