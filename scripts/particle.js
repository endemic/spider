class Particle {
  hue = 0;

  lightness = 0;

  size = 20;

  accel = {
    x: 0,
    y: 0
  };

  vel = {
    x: 0,
    y: 0
  };

  pos = {
    x: 0,
    y: 0
  };

  // reset
  init() {

  }

  // idea being that if each call to `draw` returns false, each particle is ready to be re-drawn
  draw(context, delta) {
    // x, y, radius, startAngle, endAngle
    context.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);

    // color
    context.fillStyle = `hsl(${this.hue} 100% ${this.lightness})`;
    context.fill();

    // border
    context.strokeStyle = '#000';
    context.stroke();

    // slow accel
    this.accel.x -= 1;
    this.accel.y -= 1;

    // when accel is 0, apply gravity and reduce lightness/size
    if (this.accel.x < 0 && this.accel.y < 0) {
      this.size -= 1;
      this.lightness -= 1;
    }

    return this.lightness > 0;
  }
};
