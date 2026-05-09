import React, { useCallback, useRef } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { DeviceIcon }     from '../UI/DeviceIcon';
import type { Device }    from '../../types/device';
import styles from './NetworkCanvas.module.css';

const CIRCLE_R = 31;

interface DeviceNodeProps {
  device:       Device;
  isDrawSource: boolean;
  isWiring:     boolean;
  heat?:        number;
  onWireClick:  (deviceId: string, event: React.MouseEvent) => void;
  onEditClick:  (deviceId: string) => void;
  onNodeContextMenu: (deviceId: string) => void;
}

export const DeviceNode: React.FC<DeviceNodeProps> = ({
  device, isDrawSource, isWiring, heat = 0, onWireClick, onEditClick, onNodeContextMenu,
}) => {
  const {
    removeDevice, moveDevice, moveSelected, selectedDeviceId, selectedIds,
    toggleSelectId,
  } = useCanvasStore();

  const isSelected      = selectedDeviceId === device.id;
  const isMultiSelected = selectedIds.has(device.id);
  const anySelected     = isSelected || isMultiSelected;
  const draggedRef      = useRef(false);

  const handleWireClick = useCallback((event: React.MouseEvent) => onWireClick(device.id, event), [device.id, onWireClick]);

  function handleMouseDownFull(e: React.MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();

    // Shift+click → toggle multiselect, no drag/wire
    if (e.shiftKey) {
      e.preventDefault();
      toggleSelectId(device.id);
      return;
    }

    const isGroupDrag = selectedIds.size > 1 && selectedIds.has(device.id);
    const startX = e.clientX;
    const startY = e.clientY;
    let lastX = e.clientX;
    let lastY = e.clientY;
    const originX = device.x;
    const originY = device.y;

    draggedRef.current = false;

    const onMove = (me: MouseEvent) => {
      const totalDx = me.clientX - startX;
      const totalDy = me.clientY - startY;

      // Small threshold so clicks do not accidentally trigger dragging.
      if (!draggedRef.current && Math.hypot(totalDx, totalDy) < 4) return;

      draggedRef.current = true;
      const stepDx = me.clientX - lastX;
      const stepDy = me.clientY - lastY;

      if (isGroupDrag) {
        moveSelected(stepDx, stepDy);
      } else {
        moveDevice(device.id, originX + totalDx, originY + totalDy);
      }

      lastX = me.clientX;
      lastY = me.clientY;
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleClick(e: React.MouseEvent) {
    // Suppress wire-click if this interaction was a drag.
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }

    handleWireClick(e);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onNodeContextMenu(device.id);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (selectedIds.size > 1 && selectedIds.has(device.id)) {
      useCanvasStore.getState().removeSelected();
    } else {
      removeDevice(device.id);
    }
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation();
    onEditClick(device.id);
  }

  return (
    <div
      className={`${styles.node}
        ${isSelected                ? styles.nodeSelected      : ''}
        ${isMultiSelected           ? styles.nodeMultiSelected  : ''}
        ${isDrawSource              ? styles.nodeDrawSource     : ''}
        ${heat >= 0.3               ? styles.nodeHeating        : ''}
        ${heat >= 0.6               ? styles.nodeHot            : ''}
        ${heat >= 0.9               ? styles.nodeOverheated     : ''}
        ${isWiring && !isDrawSource ? styles.nodeDrawTarget     : ''}`}
      style={{ left: device.x - CIRCLE_R, top: device.y - CIRCLE_R }}
      onMouseDown={handleMouseDownFull}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
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
          className={styles.editBadge}
          title="Edit Device"
          onMouseDown={handleEditClick}
        >
          Edit
        </div>
      )}

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
