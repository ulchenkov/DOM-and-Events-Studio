// Write your JavaScript code here.
// Remember to pay attention to page loading!
let mission;
const DEFAULT_DELTA = 10; //px
const SCALE = 1000;
const AUTOPILOT_SPEED = 3; //px
const AUTOPILOT_TIMER = 50; //ms

const DIRECTIONS = {
    Up : {deltaX : 0, deltaY : -1},
    Down : {deltaX : 0, deltaY : 1},
    Left : {deltaX : -1, deltaY : 0},
    Right : {deltaX : 1, deltaY : 0}
}
const FILGHT_STATUS = {
    onTheGroud : "onTheGroud",
    inFligt : "inFligt",
    landing : "landing",
    missionAborted : "missionAborted"
}

const FLIGHT_STATUS_MESSAGE = {
    onTheGroud : "Space shuttle ready for takeoff.",
    inFligt : "Shuttle in flight.",
    landing : "The shuttle is landing. Landing gear engaged.",
    missionAborted : "Mission aborted."
}

class Rocket {
    #position;
    #id;
    #limitX;
    #limitY;

    constructor(rocketId, startPosition, limitX, limitY) {
        this.#id = rocketId;
        this.#position = startPosition;
        this.#limitX = limitX;
        this.#limitY = limitY;
        this.#display();
    }

    #display() {
        this.#id.style.position = "absolute";
        this.#id.style.left = `${this.#position.x}px`;
        this.#id.style.top = `${this.#position.y}px`;
    }
    get position() {
        return this.#position;
    }

    setPosition(newPosition) {
        let tryX = newPosition.x >= 0 && newPosition.x <=  this.#limitX;
        let tryY = newPosition.y >= 0 && newPosition.y <= this.#limitY;
        if (tryX && tryY)
             {
                this.#position = newPosition;
                this.#display();
        } 
        return {
            isCompeted : tryX && tryY,
            x : tryX,
            y: tryY
        }
    }

    move(direction, delta) {
        if (DIRECTIONS[direction] === undefined) {
            throw Error(`Illegal method argumnet. Method: move(), 'direction' = ${direction}`);
        }
        if (Number(delta) === NaN) {
            throw Error(`Illegal method argumnet. Method: move(), 'delta' = ${delta}`);
        }

        let newPosition = {
            x : this.#position.x + DIRECTIONS[direction].deltaX * delta,
            y : this.#position.y + DIRECTIONS[direction].deltaY * delta
        }

        return this.setPosition(newPosition);
    }
}

class MissionControl {
    #rocket;
    #rocketId;
    #background;

    #missionButtons;
    #rocketButtons;

    #flightStatusDispaly
    #autoPilotStatusDisplay
    #shuttleHeightDisplay
    #warningDisplay
    
    #rocketFlyStatus;
    #autoPilotStatus;

    #startPosition;
    #autopilotDirection;
    #autopilotTimer;
    #landingTimer;

    constructor() {
        this.#rocketId = document.getElementById("rocket");
        this.#background = document.getElementById("shuttleBackground");

        this.#startPosition = {
            x : (this.#background.clientWidth - this.#rocketId.clientWidth) / 2,
            y : (this.#background.clientHeight - this.#rocketId.clientHeight)
        }
        let limitX = this.#background.clientWidth - this.#rocketId.clientWidth;
        let limitY = this.#background.clientHeight - this.#rocketId.clientHeight;

        this.#rocket = new Rocket(this.#rocketId, this.#startPosition, limitX, limitY);

        this.#rocketButtons = document.querySelectorAll(".rocketControl");
        this.#rocketButtons.forEach(button => button.addEventListener("click", (event) => rocketControlButtonsHandler(event)));

        this.#missionButtons = {
            takeoff :  document.getElementById("takeoff"),
            land : document.getElementById("landing"),
            abort : document.getElementById("missionAbort"),
            autopilot : document.getElementById("autopilot")
        };
        for(let button in this.#missionButtons) {
            this.#missionButtons[button].addEventListener("click", (event) => missionControlButtonsHandler(event));
        }

        this.#flightStatusDispaly = document.getElementById("flightStatus");
        this.#autoPilotStatusDisplay = document.getElementById("autopilotStatus");
        this.#shuttleHeightDisplay = document.getElementById("spaceShuttleHeight");
        this.#warningDisplay = document.getElementById("warning");

        this.#rocketFlyStatus = FILGHT_STATUS.onTheGroud;
        this.#autoPilotStatus = false;

        this.#autopilotDirection = {x : 1, y : -1};

        this.dispalyMissionStatus();
    }

    missionButtonsHandler(button) {
        switch (button) {
            case this.#missionButtons.takeoff : 
                if (confirm("Confirm that the shuttle is ready for takeoff.")) {
                    this.#rocketFlyStatus = FILGHT_STATUS.inFligt;
                }
                break;
            case this.#missionButtons.land :
                alert("The shuttle is landing. Landing gear engaged.");
                this.#rocketFlyStatus = FILGHT_STATUS.landing; 
                if (this.#autoPilotStatus) {
                    this.#autoPilotStatus = !this.#autoPilotStatus;
                    clearTimeout(this.#autopilotTimer);
                }
                this.land();
                break;
            case this.#missionButtons.abort : 
                if (confirm("Confirm that you want to abort the mission.")) {
                    if (this.#rocketFlyStatus === FILGHT_STATUS.landing) {
                        clearTimeout(this.#landingTimer);
                    }
                    if (this.#autoPilotStatus) {
                        this.#autoPilotStatus = !this.#autoPilotStatus;
                        clearTimeout(this.#autopilotTimer);
                    }
                    this.#rocket.setPosition(this.#startPosition);
                    this.#rocketFlyStatus =FILGHT_STATUS.missionAborted;
                }
                break;
            case this.#missionButtons.autopilot : 
                if (this.#autoPilotStatus) {
                    clearTimeout(this.#autopilotTimer);
                } else {
                    this.autoPilot();
                }
                this.#autoPilotStatus = !this.#autoPilotStatus;
                break;
        }
        this.dispalyMissionStatus();
    }

    moveRocket(button) {
        let action = button.id.split("-")[0];
        if (action === "move") {
            let direction = button.id.split("-")[1];
            let tryMove = this.#rocket.move(direction, DEFAULT_DELTA);
            if (!tryMove.isCompeted) {
                this.#warningDisplay.innerHTML = `Can't move this direction:<br>${direction.toUpperCase()}`;
                this.#warningDisplay.style.color = "Red";
                this.#warningDisplay.style.visibility = ""
                let timer = setTimeout(() => document.getElementById("warning").style.visibility = "hidden", 600);
            } else {
                this.dispalyMissionStatus();
            }
        }
    }

    autoPilot() {
        let currentPosition = this.#rocket.position;
        let tryMove = this.#rocket.setPosition({
            x : currentPosition.x + this.#autopilotDirection.x * AUTOPILOT_SPEED,
            y : currentPosition.y + this.#autopilotDirection.y * AUTOPILOT_SPEED
        });
        if (!tryMove.isCompeted) {
            if (!tryMove.x) {
                this.#autopilotDirection.x *= -1;
            }
            if (!tryMove.y) {
                this.#autopilotDirection.y *= -1;
            }
        }
        this.dispalyMissionStatus();
        this.#autopilotTimer = setTimeout(autoPilot, AUTOPILOT_TIMER);
    }
    land() {
        let currentPosition = this.#rocket.position;
        if (currentPosition.x === this.#startPosition.x && 
            currentPosition.y === this.#startPosition.y) {
                this.#rocketFlyStatus = FILGHT_STATUS.onTheGroud;
        } else {
            let deltaX = this.#startPosition.x - currentPosition.x;
            let deltaY = this.#startPosition.y - currentPosition.y;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.round(deltaY / deltaX) === 1) {
                    deltaY = deltaY / Math.abs(deltaY);
                } else {
                    deltaY = 0;
                }
                deltaX = deltaX / Math.abs(deltaX);
            } else {
                if (Math.round(deltaY / deltaX) === 1) {
                    deltaX = deltaX / Math.abs(deltaX);
                } else {
                    deltaX = 0;
                }
                deltaY = deltaY / Math.abs(deltaY);
            }
            this.#rocket.setPosition({x : currentPosition.x + deltaX, y : currentPosition.y + deltaY});
            this.#landingTimer = setTimeout(land, AUTOPILOT_TIMER);
        }
        this.dispalyMissionStatus();
    }

    dispalyMissionStatus() {
        switch (this.#rocketFlyStatus) {
            case FILGHT_STATUS.onTheGroud :
                this.#rocketButtons.forEach((button) => button.disabled = true);
                Object.keys(this.#missionButtons).forEach((button) => this.#missionButtons[button].disabled = true);
                this.#missionButtons.takeoff.disabled = false;
                this.#background.style.backgroundColor = "Green";
                break;
            case FILGHT_STATUS.inFligt :
                this.#rocketButtons.forEach((button) => button.disabled = this.#autoPilotStatus ? true : false);
                Object.keys(this.#missionButtons).forEach((button) => this.#missionButtons[button].disabled = false);
                this.#missionButtons.takeoff.disabled = true;
                this.#background.style.backgroundColor = "Blue";
                break;
            case FILGHT_STATUS.landing :
                this.#rocketButtons.forEach((button) => button.disabled = true);
                Object.keys(this.#missionButtons).forEach((button) => this.#missionButtons[button].disabled = true);
                this.#missionButtons.abort.disabled = false;
                this.#background.style.backgroundColor = "Blue";
                break;
            case FILGHT_STATUS.missionAborted :
                this.#rocketButtons.forEach((button) => button.disabled = true);
                Object.keys(this.#missionButtons).forEach((button) => this.#missionButtons[button].disabled = true);
                this.#missionButtons.takeoff.disabled = false;
                this.#background.style.backgroundColor = "Green";
                break;
        }

        this.#flightStatusDispaly.innerHTML = FLIGHT_STATUS_MESSAGE[this.#rocketFlyStatus];

        this.#autoPilotStatusDisplay.innerHTML = `Autopilot is ${this.#autoPilotStatus ? "ON" : "OFF"}`;
        this.#autoPilotStatusDisplay.style.color = this.#autoPilotStatus ? "Green" : "Gray";
        this.#missionButtons.autopilot.innerHTML = `Turn ${this.#autoPilotStatus ? "OFF" : "ON"} autopilot`;

        if (this.#rocketFlyStatus === FILGHT_STATUS.inFligt || this.#rocketFlyStatus === FILGHT_STATUS.landing) {
            let height = this.#background.clientHeight - this.#rocketId.clientHeight - this.#rocket.position.y;
            height = (height + 10) * SCALE;
            this.#shuttleHeightDisplay.innerHTML = formatNumber(height);
        } else {
            this.#shuttleHeightDisplay.innerHTML = 0;
        }
    }
}

function init() { 
    mission = new MissionControl();
    document.addEventListener("keydown", (event) => console.log(event.key));
}

function rocketControlButtonsHandler(event) {
    mission.moveRocket(event.target);
}

function missionControlButtonsHandler(event) {
    mission.missionButtonsHandler(event.target);
}

function autoPilot() {
    mission.autoPilot();
}

function land() {
    mission.land();
}

window.addEventListener("load", init);

function formatNumber(number) {
    if (Number(number) === NaN || number === "") {
      return number;
    }
    let minus = number < 0 ? "-" : "";
    number = String(Math.abs(number));
    
    let parts = number.split(".");
    let decimal = parts.length > 1 ? parts[1] : "";
    number = parts[0];

    let output ="";
    while (number.length > 3) {
          output = `${number.slice(-3)}${output === "" ? "" : "."}${output}`;
      number = number.slice(0, -3);
    }
    
    if (number !== "") {
      output = `${number}${output === "" ? "" : "."}${output}`;
    }

    output = `${minus}${output}${decimal !== "" ? "," : ""}${decimal}`;
    return output;
}