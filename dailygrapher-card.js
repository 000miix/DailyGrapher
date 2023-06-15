import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class DailyGrapherCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      currentTime: {},
      date: {},
      data: { dailyActivities: [] },
    };
  }

  getDates() {
    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    today = today.toLocaleDateString("sv-SE"); // only need the day
    tomorrow = tomorrow.toLocaleDateString("sv-SE"); // only need the day
    return { today, tomorrow };
  }

  setConfig(config) {

    if (!config.entity && !config.entities) {
      throw new Error("You need to define an entity");
    }
    this.config = config;
    this.date = this.getDates();
  }

  getCardSize() {
    return 2;
  }

  connectedCallback() {
    super.connectedCallback();
    this.getCalendarEvents();
    this.currentTime = new Date();
    this.interval = window.setInterval(() => {
      this.currentTime = new Date();
    }, 10000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.interval);
  }

  async getCalendarEvents() {
    const activities = [];
    const failedActivities = [];
    const calendarEntityPromises = [];
    let calendarEntities = [];

    if (Array.isArray(this.config.entity)) {
      calendarEntities = this.config.entity;
    } else {
      calendarEntities.push(this.config.entity);
    }

    // retrieve activies in all calendars
    calendarEntities.forEach(entity => {
      const calendarEntity = (entity && entity.entity) || entity;
      const url = `calendars/${calendarEntity}?start=${this.date.today}&end=${this.date.tomorrow}`;

      // make all requests at once
      calendarEntityPromises.push(
          this.hass.callApi('get', url)
              .then(events => {
                  activities.push(...events);
              })
              .catch(error => {
                  failedActivities.push({
                      name: entity.name || calendarEntity,
                      error
                  });
              })
      );
    });

    // wait until all requests either succeed or fail
    await Promise.all(calendarEntityPromises);

    let items = activities.map((activity) => {
      return {
        summary: activity.summary,
        start: {
          date: activity.start.date || activity.start.dateTime.split("T")[0],
          time:
            activity.start.dateTime?.split("T")[1].split("+")[0] || "00:00:00",
        },
        end: {
          date: activity.end.date || activity.end.dateTime.split("T")[0],
          time:
            activity.end.dateTime?.split("T")[1].split("+")[0] || "23:59:00",
        },
      };
    });

    this.data = { dailyActivities: items };
  }

  markings() {
    let markers = [];
    let n = 0;
    for (let i = 0; i < 360; i += 30) {
      for (let j = 5; j <= 25; j += 5) {
        markers.push(
          html`<div
            class="marking small"
            style="transform: rotate(${i + j}deg)"
          ></div>`
        );
      }
      markers.push(
        html`<div class="marking" style="transform: rotate(${i}deg)">
          <div style="padding-top: 20px;">
            <div
              class="hour"
              style="transform-origin: center; transform: rotate(${-i}deg);"
            >
              ${n === 0 ? 12 : n}
            </div>
          </div>
        </div>`
      );
      n++;
    }
    return markers;
  }

  clock() {
    const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const hours = this.currentTime.getHours();
    const isAm = hours < 12;

    let dayOfWeek = this.currentTime.getDay();
    let date = this.currentTime.getDate();
    let hh = hours;
    if (!this.config.display_24_hour_time) {
      hh = hours % 12;
      hh === 0 ? (hh = 12) : hh;
    }

    let mm = this.currentTime.getMinutes();
    mm = mm < 10 ? "0" + mm : mm;

    return html` <div class="wrapper">
      <div class="clock">
        <div class="clock-content">
          <div class="ampm">${this.config.display_24_hour_time ? "" : isAm ? "am" : "pm"}</div>
          <h2 class="time">${hh}:${mm}</h2>
          <div class="day">${weekdays[dayOfWeek]} ${date}</div>
        </div>
      </div>
    </div>`;
  }

  getDurationPercentage(startDeg, endDeg, isAm, endsOnFutureDate) {
    if (endDeg === 0) endDeg = 360;
    if (isAm || endsOnFutureDate) {
      if (startDeg > endDeg) endDeg += 360;
      if (endDeg > 360) endDeg = 360;
    } else {
      if (startDeg > endDeg) startDeg -= 360;
      if (startDeg < 0) startDeg = 0;
    }

    const durationInDeg = endDeg - startDeg;
    const durationInPercentage = (durationInDeg / 360) * 100;
    return durationInPercentage;
  }

  getRotation(hours, minutes) {
    const hoursRotation = ((hours % 12) / 12) * 360;
    const minutesRotation = ((365 / 12) * minutes) / 60;
    const rotation = hoursRotation + minutesRotation;
    return rotation;
  }
  hand() {
    const rotation = this.getRotation(
      this.currentTime.getHours(),
      this.currentTime.getMinutes()
    );
    return html`<div
      class="hand"
      style="transform: rotate(${rotation}deg)"
    ></div>`;
  }

  activities() {
    if(!this.data.dailyActivities) return null;
    return this.data.dailyActivities.map((activity, index) => {
      const localTime = this.currentTime?.toLocaleTimeString("sv-SE");
      const { today } = this.date;
      const hours = this.currentTime.getHours();
      const endsOnFutureDate = activity.end.date > today;
      const isAm = hours < 12;
      const isPassed =
        today === activity.end.date && localTime > activity.end.time;

      const isFullDay =
        activity.start.date < activity.end.date &&
        activity.start.time === "00:00:00" &&
        activity.end.time === "23:59:00";
      const isActive =
        !isFullDay &&
        localTime > activity.start.time &&
        (localTime < activity.end.time || endsOnFutureDate);

      const [startHours, startMinutes] = activity.start.time.split(":");
      const [endHours, endMinutes] = activity.end.time.split(":");

      const isHidden =
        (isAm && startHours > 12) ||
        (!isAm && endHours < 12 && !endsOnFutureDate);

      const activityStartsAtRotation = this.getRotation(
        startHours,
        startMinutes
      );
      const activityEndsAtRotation = this.getRotation(endHours, endMinutes);

      const activityContinuesInPM =
        !isFullDay &&
        Number(startHours) + startMinutes / 60 < 12 &&
        Number(endHours) + endMinutes / 60 > 12;

      const durationTime = {
        hours: (Number(endHours) + 24 - Number(startHours)) % 12,
        minutes: (Number(endMinutes) + 60 - Number(startMinutes)) % 60,
      };
      const formattedDurationTime = `${
        durationTime.hours ? `${durationTime.hours}h` : ""
      }${durationTime.minutes ? `${durationTime.minutes}m` : ""}`;
      const duration = this.getDurationPercentage(
        activityStartsAtRotation,
        activityEndsAtRotation,
        isAm,
        endsOnFutureDate
      );
      const isEven = index % 2 === 0
      let style = { backgroundColor: isEven?  "#0b4f70" : '#16597a', opacity: "0.8" };
      if (isActive) {
        style.backgroundColor = "#58afe4" ;
        style.opacity = "0.95";
      }
      if (isPassed) {
        style.backgroundColor = "#888";
        style.opacity = "0.5";
      }
      if (isFullDay) {
        if (!this.config.hide_full_day_events) {
          return html`<div class="full-day-activity">${activity.summary}</div>`;
        }
        return html``;
      }

      function getStartRotation() {
        if (endsOnFutureDate) {
          return activityStartsAtRotation;
        }
        if (activityStartsAtRotation > activityEndsAtRotation && !isAm) {
          return 0;
        }
        return activityStartsAtRotation;
      }
      return html` <div
        class="activity ${isActive ? "active" : ""}"
        ?hidden="${isHidden}"
        style="opacity: ${style.opacity}; 
              background: conic-gradient(${style.backgroundColor} ${duration}%, transparent 0); 
              transform: rotate(${getStartRotation()}deg);"
      >
        ${endsOnFutureDate
          ? html`<div
              class="continues 
                ${isActive ? "active" : ""} 
                ${isPassed ? "passed" : ""}"
              style="
                transform: rotate(${!isAm
                ? 360 - activityStartsAtRotation
                : 0}deg);"
            ></div>`
          : ""}
        ${activityContinuesInPM
          ? html`<div
              class="continues 
                ${isActive ? "active" : ""}
                ${isPassed ? "passed" : ""}"
              style="
                transform: rotate(${isAm
                ? 360 - activityStartsAtRotation
                : 0}deg);"
            ></div>`
          : ""}
        <div class="activity-line">
          <div class="duration">${formattedDurationTime}</div>
        </div>
        <div class="text-vertical">
          <div class="${activityStartsAtRotation < 180 ? "rotate-text" : ""}">
            ${activity.summary}
          </div>
        </div>
      </div>`;
    });
  }

 static get styles() {
    return css`
      :host {
        --dark: #252526;
        --gray: #888;
        --lightblue: #58afe4;
        --backgroundBlue: #16597a;
        --red: red;
      }
      .continues::before {
        content: "";
        width: 20px;
        height: 20px;
        z-index: -1;
        position: absolute;
        top: 26px;
        left: -10px;
        background-image: linear-gradient(
          to top right,
          transparent 0 50%,
          var(--backgroundBlue) 50% 100%
        );
        transform: rotate(45deg);
        border-top-right-radius: 4px;
        border-bottom-left-radius: 4px;
      }
      .continues.active::before {
        background-color: var(--lightblue);
      }
      .continues.passed::before {
        background-color: var(--gray);
      }
      .duration {
        transform:translate(6px,10px) rotate(7deg);
        color: rgb(172 224 255);
        top: 5px;
        left: 5px;

      }
      .wrapper {
        display: block;
        position: absolute;
        aspect-ratio: 1/1;
        width: 80px;
        z-index: 3;
        border-radius: 50%;
        background-color: var(--lightblue);
        border: 5px solid var(--dark);
      }
      .outer-clock {
        max-width: 380px;
        aspect-ratio: 1/1;
        margin: 0 auto;
        background: var(--dark);
        position: relative;
        display: grid;
        place-items: center;
        border-radius: 50%;
        overflow: hidden;
      }

      .activity[hidden] {
        display: none !important;
      }

      .full-day-activity {
        padding: 2px 10px;
        border-radius: 6px;
        background-color: var(--lightblue);
        border: 1px solid white;
        position: absolute;
        top: 30%;
        display: flex;
        justify-content: center;
        color: white;
        z-index: 1;
      }

      .activity {
        width: 100%;
        height: 100%;
        color: white;
        display: flex;
        position: absolute;
        top: 10px;
        left: 10px;
        border-radius: 50%;
        inset: 0;
        justify-content: center;
      }

      .activity-line {
        height: 100%;
        width: 1px;
        position:relative;
        background-image: linear-gradient(
          to top,
          transparent 0 50%,
          #eee 50% 93%,
          transparent 93% 100%
        );
      }
      .marking {
        height: 100%;
        color: white;
        width: 4px;
        position: absolute;
        display: flex;
        justify-content: center;
        left: calc(50% - 2px);
        background-image: linear-gradient(
          to top,
          transparent 0% 96%,
          #eee 96% 100%
        );
      }
      .marking.small {
        width: 2px;
        background-image: linear-gradient(
          to top,
          transparent 0% 98%,
          #ccc 98% 100%
        );
      }
   .hand {
        background-image: linear-gradient(
          to top,
          transparent 0 50%,
          var(--red) 50% 75%,
          transparent 75% 100%
        );
        position: absolute;
        width: 4px;
        z-index: 2;
        height: 100%;
      }
      .hand::before {
        content: "•";
        position: absolute;
        font-size: 36px;
        top: 5px;
        left: -100%;
        z-index: 2;
        color: var(--red);
      }
      .hand::after {
        content: "•";
        position: absolute;
        font-size: 36px;
        left: -100%;
        top: 23%;
        z-index: 2;
        color: var(--red);
      }
      .clock {
        display: grid;
        height: 100%;
        place-items: center;
      }
      .clock-content {
        text-align: center;
      }
      .ampm {
        min-height: 1.5em;
      }
      .hour {
        font-size: 16px;
      }
      .time {
        font-weight: 900;
        margin: 0px;
      }
      .active {
        font-weight: bold;
      }

      .text-vertical {
        position: absolute;
        font-size: 14px;
        top: 0;
        left: 50%;
        transform-origin: -7px 27px;
        transform: rotate(90deg);
      }
      .rotate-text {
        transform-origin: center;
        transform: rotate(180deg);
      }
    `;
  }
  
  render() {
    if (!this.data) return "loading";
    return html`
      <ha-card>
        <div class="card-content">
          <div class="outer-clock">
            ${this.markings()} ${this.clock()} ${this.hand()}
            ${this.activities()}
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("dailygrapher-card", DailyGrapherCard);
