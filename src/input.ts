// Turns cursor / touch / device orientation into a smoothed tilt in [-1, 1]².
// x > 0 = right, y > 0 = up. With no input the card holds still.

type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const clamp = (v: number, a = -1, b = 1) => Math.min(b, Math.max(a, v));

export class TiltInput {
  /** Smoothed tilt, read every frame. */
  readonly value = { x: 0, y: 0 };
  private target = { x: 0, y: 0 };
  private gyroBase: { beta: number; gamma: number } | null = null;
  private usingGyro = false;
  /** While the card is being swiped, the pointer spins it instead of tilting it. */
  paused = false;

  /**
   * mapX / mapY turn a phone tilt in degrees (signed, from the starting pose)
   * into a card tilt in [-1, 1].
   */
  constructor(
    private el: HTMLElement,
    private mapX: (deg: number) => number,
    private mapY: (deg: number) => number,
    private smoothing = 7,
  ) {
    el.addEventListener("pointermove", this.onPointer);
    el.addEventListener("pointerdown", this.onPointer);
    // Recentre gyro when the phone is rotated.
    window.addEventListener("orientationchange", () => (this.gyroBase = null));
  }

  /** True on iOS, where motion access must be granted from a tap. */
  get needsMotionPermission() {
    const C = window.DeviceOrientationEvent as OrientationCtor | undefined;
    return !!C && typeof C.requestPermission === "function";
  }

  async enableMotion() {
    const C = window.DeviceOrientationEvent as OrientationCtor | undefined;
    if (!C) return false;
    if (typeof C.requestPermission === "function") {
      try {
        if ((await C.requestPermission()) !== "granted") return false;
      } catch {
        return false;
      }
    }
    window.addEventListener("deviceorientation", this.onOrientation);
    return true;
  }

  private onPointer = (e: PointerEvent) => {
    // On touch screens the gyro wins once it is producing data.
    if (this.paused || (e.pointerType === "touch" && this.usingGyro)) return;
    const r = this.el.getBoundingClientRect();
    this.target.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
    this.target.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1));
  };

  private onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    const landscape = Math.abs((screen.orientation?.angle ?? 0) % 180) === 90;
    const beta = landscape ? e.gamma : e.beta;
    const gamma = landscape ? -e.beta : e.gamma;
    // First reading = how the user naturally holds the phone.
    if (!this.gyroBase) this.gyroBase = { beta, gamma };
    this.target.x = clamp(this.mapX(gamma - this.gyroBase.gamma));
    this.target.y = clamp(this.mapY(beta - this.gyroBase.beta));
    this.usingGyro = true;
  };

  update(dt: number) {
    const k = 1 - Math.exp(-dt * this.smoothing);
    this.value.x += (this.target.x - this.value.x) * k;
    this.value.y += (this.target.y - this.value.y) * k;
  }
}
