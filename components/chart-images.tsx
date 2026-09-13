'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import type { Trade } from '@/lib/domain';
import type { Translate } from './workspace-ui';

type Props = { trade: Trade; mode: string; t: Translate };
type Position = { x: number; y: number; scale: number };
const initial: Position = { x: 0, y: 0, scale: 1 };
const limit = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export default function ChartImages({ trade, mode, t }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const label = (id: string) =>
    trade.imageStages?.[id] === 'before'
      ? t('Before entry', 'ก่อนเข้าเทรด')
      : trade.imageStages?.[id] === 'after'
        ? t('After exit', 'หลังจบเทรด')
        : t('Chart', 'ภาพกราฟ');
  return (
    <>
      <div className="chart-thumbnails">
        {trade.imageIds.map((id, index) => (
          <button
            type="button"
            className="chart-thumbnail"
            key={id}
            onClick={() => setSelected(index)}
            aria-label={`${t('Expand image', 'ขยายภาพ')} ${index + 1} · ${label(id)}`}
          >
            <Image
              unoptimized
              width={260}
              height={170}
              src={`/api/images/${id}?mode=${mode}`}
              alt={`${label(id)} ${index + 1}`}
            />
            <span>
              {label(id)} <Maximize2 size={15} />
            </span>
          </button>
        ))}
      </div>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected !== null && trade.imageIds[selected] && (
          <DialogContent className="chart-lightbox" showCloseButton={false}>
            <div className="chart-lightbox-heading">
              <div>
                <DialogTitle>
                  {trade.symbol} · {label(trade.imageIds[selected])}
                </DialogTitle>
                <DialogDescription>
                  {selected + 1} / {trade.imageIds.length} ·{' '}
                  {t(
                    'Scroll or pinch to zoom. Drag to explore.',
                    'เลื่อนล้อเมาส์หรือถ่างนิ้วเพื่อซูม ลากเพื่อดูรายละเอียด',
                  )}
                </DialogDescription>
              </div>
              <button
                type="button"
                className="chart-control"
                aria-label={t('Close image viewer', 'ปิดตัวดูภาพ')}
                onClick={() => setSelected(null)}
              >
                <X size={22} />
              </button>
            </div>
            <ZoomableChart
              key={trade.imageIds[selected]}
              id={trade.imageIds[selected]}
              mode={mode}
              t={t}
              label={label(trade.imageIds[selected])}
              previous={
                selected > 0 ? () => setSelected(selected - 1) : undefined
              }
              next={
                selected < trade.imageIds.length - 1
                  ? () => setSelected(selected + 1)
                  : undefined
              }
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function ZoomableChart({
  id,
  mode,
  t,
  label,
  previous,
  next,
}: {
  id: string;
  mode: string;
  t: Translate;
  label: string;
  previous?: () => void;
  next?: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const position = useRef<Position>(initial);
  const [view, setView] = useState<Position>(initial);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const points = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    view: Position;
    center: { x: number; y: number };
    distance: number;
  } | null>(null);
  const update = (value: Position) => {
    const scale = limit(value.scale, 1, 8);
    const width = stage.current?.clientWidth || 0,
      height = stage.current?.clientHeight || 0;
    const result = {
      scale,
      x: limit(value.x, (-width * (scale - 1)) / 2, (width * (scale - 1)) / 2),
      y: limit(
        value.y,
        (-height * (scale - 1)) / 2,
        (height * (scale - 1)) / 2,
      ),
    };
    position.current = result;
    setView(result);
  };
  const zoom = (scale: number, x = 0, y = 0) => {
    const before = position.current,
      ratio = limit(scale, 1, 8) / before.scale;
    update({
      scale,
      x: x - (x - before.x) * ratio,
      y: y - (y - before.y) * ratio,
    });
  };
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      zoom(
        position.current.scale * Math.exp(-event.deltaY * 0.002),
        event.clientX - rect.left - rect.width / 2,
        event.clientY - rect.top - rect.height / 2,
      );
    };
    element.addEventListener('wheel', wheel, { passive: false });
    const observer = new ResizeObserver(() => update(position.current));
    observer.observe(element);
    return () => {
      element.removeEventListener('wheel', wheel);
      observer.disconnect();
    };
  }, []);
  const anchor = () => {
    const values = [...points.current.values()];
    if (!values.length) {
      gesture.current = null;
      return;
    }
    const a = values[0],
      b = values[1] || a;
    gesture.current = {
      view: { ...position.current },
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.hypot(a.x - b.x, a.y - b.y),
    };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!points.current.has(event.pointerId) || !gesture.current) return;
    points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const values = [...points.current.values()],
      a = values[0],
      b = values[1] || a,
      start = gesture.current;
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const scale = limit(
      start.view.scale *
        (values.length > 1 && start.distance > 0
          ? Math.hypot(a.x - b.x, a.y - b.y) / start.distance
          : 1),
      1,
      8,
    );
    const rect = stage.current!.getBoundingClientRect(),
      ratio = scale / start.view.scale;
    const x = start.center.x - rect.left - rect.width / 2,
      y = start.center.y - rect.top - rect.height / 2;
    update({
      scale,
      x: x - (x - start.view.x) * ratio + center.x - start.center.x,
      y: y - (y - start.view.y) * ratio + center.y - start.center.y,
    });
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    points.current.delete(event.pointerId);
    anchor();
  };
  return (
    <>
      <div className="chart-zoom-toolbar">
        <button
          type="button"
          className="chart-control"
          disabled={!previous}
          aria-label={t('Previous image', 'ภาพก่อนหน้า')}
          onClick={previous}
        >
          <ChevronLeft size={21} />
        </button>
        <button
          type="button"
          className="chart-control"
          disabled={view.scale <= 1 || !loaded}
          aria-label={t('Zoom out', 'ย่อภาพ')}
          onClick={() => zoom(view.scale / 1.5)}
        >
          <Minus size={20} />
        </button>
        <output aria-label={t('Zoom level', 'ระดับการซูม')}>
          {Math.round(view.scale * 100)}%
        </output>
        <button
          type="button"
          className="chart-control"
          disabled={view.scale >= 8 || !loaded}
          aria-label={t('Zoom in', 'ขยายภาพเพิ่ม')}
          onClick={() => zoom(view.scale * 1.5)}
        >
          <Plus size={20} />
        </button>
        <button
          type="button"
          className="chart-control chart-fit"
          onClick={() => update(initial)}
        >
          {t('Fit', 'พอดีจอ')}
        </button>
        <button
          type="button"
          className="chart-control"
          disabled={!next}
          aria-label={t('Next image', 'ภาพถัดไป')}
          onClick={next}
        >
          <ChevronRight size={21} />
        </button>
      </div>
      <div
        ref={stage}
        className="chart-zoom-stage"
        tabIndex={0}
        role="group"
        aria-label={t(
          'Zoomable chart. Use plus, minus, zero to reset, or arrow keys to pan.',
          'ภาพซูมได้ ใช้ปุ่มบวก ลบ ศูนย์เพื่อคืนขนาด และลูกศรเพื่อเลื่อนภาพ',
        )}
        style={{ cursor: view.scale > 1 ? 'grab' : 'zoom-in' }}
        onKeyDown={(event) => {
          if (
            [
              '+',
              '=',
              '-',
              '0',
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
            ].includes(event.key)
          )
            event.preventDefault();
          if (event.key === '+' || event.key === '=') zoom(view.scale * 1.5);
          if (event.key === '-') zoom(view.scale / 1.5);
          if (event.key === '0') update(initial);
          if (event.key.startsWith('Arrow'))
            update({
              ...view,
              x:
                view.x +
                (event.key === 'ArrowLeft'
                  ? 50
                  : event.key === 'ArrowRight'
                    ? -50
                    : 0),
              y:
                view.y +
                (event.key === 'ArrowUp'
                  ? 50
                  : event.key === 'ArrowDown'
                    ? -50
                    : 0),
            });
        }}
        onDoubleClick={() => zoom(view.scale > 1 ? 1 : 2)}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          points.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
          });
          anchor();
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      >
        {!loaded && !failed && (
          <p className="chart-image-message" role="status">
            {t('Loading image…', 'กำลังโหลดภาพ…')}
          </p>
        )}
        {failed && (
          <p className="chart-image-message" role="alert">
            {t(
              'This image could not be loaded. Close the viewer and try again.',
              'โหลดภาพไม่สำเร็จ กรุณาปิดตัวดูภาพแล้วลองอีกครั้ง',
            )}
          </p>
        )}
        <Image
          unoptimized
          width={1600}
          height={1000}
          src={`/api/images/${id}?mode=${mode}`}
          alt={label}
          draggable={false}
          onLoad={() => {
            setLoaded(true);
            setFailed(false);
          }}
          onError={() => setFailed(true)}
          className="chart-full-image"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            visibility: loaded && !failed ? 'visible' : 'hidden',
          }}
        />
      </div>
    </>
  );
}
