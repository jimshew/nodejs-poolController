/*  nodejs-poolController.  An application to control pool equipment.
Copyright (C) 2016, 2017, 2018, 2019, 2020.  Russell Goldin, tagyoureit.  russ.goldin@gmail.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { O_DSYNC } from 'constants';
import { IntelliCenterBoard } from 'controller/boards/IntelliCenterBoard';
import { EasyTouchBoard } from 'controller/boards/EasyTouchBoard';

import { logger } from '../../../../logger/Logger';
import { ControllerType } from '../../../Constants';
import { Body, Circuit, ExpansionPanel, Feature, Heater, sys } from '../../../Equipment';
import { BodyTempState, ScheduleState, State, state } from '../../../State';
import { ExternalMessage } from '../config/ExternalMessage';
import { Inbound, Message } from '../Messages';

export class EquipmentStateMessage {
    private static initIntelliCenter(msg: Inbound) {
        sys.controllerType = ControllerType.IntelliCenter;
        sys.equipment.maxSchedules = 100;
        sys.equipment.maxFeatures = 32;
        // Always get equipment since this is volatile between loads. Everything else takes care of itself.
        sys.configVersion.equipment = 0;
    }
    public static initDefaults() {
        // defaults; set to lowest possible values.  Each *Touch will extend this once we know the model.
        sys.equipment.maxBodies = 1;
        sys.equipment.maxCircuits = 6;
        sys.equipment.maxSchedules = 12;
        sys.equipment.maxPumps = 2;
        sys.equipment.maxSchedules = 12;
        sys.equipment.maxValves = 2;
        sys.equipment.maxCircuitGroups = 0;
        sys.equipment.maxLightGroups = 1;
        sys.equipment.maxIntelliBrites = 8;
        sys.equipment.maxChemControllers = sys.equipment.maxChlorinators = 1;
        sys.equipment.maxCustomNames = 10;
        sys.equipment.maxChemControllers = 4;
        sys.equipment.maxFeatures = 8;
        sys.equipment.model = 'Unknown';
    }
    private static initTouch(msg: Inbound) {
        const model1 = msg.extractPayloadByte(27);
        let model2 = msg.extractPayloadByte(28);
        switch (model2) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                sys.controllerType = ControllerType.IntelliTouch;
                model2 = msg.extractPayloadByte(9);
                break;
            case 11:
                sys.controllerType = ControllerType.IntelliCom;
                break;
            case 13:
            case 14:
                sys.controllerType = ControllerType.EasyTouch;
                break;
            default:
                logger.error(`Unknown Touch Controller ${msg.extractPayloadByte(28)}:${msg.extractPayloadByte(27)}`);
                break;
        }
        let board = sys.board as EasyTouchBoard;
        board.initExpansionModules(model1, model2);
    }
    //private static initTouch(msg: Inbound, model1: number, model2: number) {
    //    switch (model2) {
    //        case 11: // SunTouch.  Eq to IntelliCom??
    //            sys.controllerType = ControllerType.IntelliCom;
    //            sys.equipment.model = 'Suntouch/Intellicom';
    //            sys.equipment.maxBodies = 2;
    //            sys.equipment.maxFeatures = 4;
    //            sys.equipment.maxValves = 2;
    //            sys.equipment.maxSchedules = 4;
    //            sys.equipment.maxCircuits = 6; // 2 filter + 2 aux
    //            sys.board.equipmentIds.invalidIds.merge([5, 7, 8, 9, 13, 14, 15, 16, 17, 18])
    //            sys.equipment.maxCircuitGroups = 0;
    //            break;
    //        case 0: // Intellitouch i5+3
    //            sys.controllerType = ControllerType.IntelliTouch;
    //            sys.equipment.maxPumps = 8; // All IntelliTouch systems can support 8VF pumps or 4VS and 4VF pumps.
    //            sys.equipment.model = 'IntelliTouch i5+3';
    //            sys.equipment.maxBodies = 2;
    //            sys.equipment.maxFeatures = 10;
    //            sys.equipment.maxValves = 4; // This needs to be looked at as 3 additional valves can be added with the valve expansion.
    //            sys.equipment.maxSchedules = 99;
    //            sys.equipment.maxCircuits = 6; // 2 filter + 5 aux
    //            sys.board.equipmentIds.invalidIds.merge([5, 7, 8, 9, 16, 17, 18])
    //            sys.equipment.maxCircuitGroups = 3;
    //            break;
    //        case 1: // IntelliTouch i7+3
    //            sys.controllerType = ControllerType.IntelliTouch;
    //            sys.equipment.maxPumps = 8; // All IntelliTouch systems can support 8VF pumps or 4VS and 4VF pumps.
    //            sys.equipment.model = 'IntelliTouch i7+3';
    //            sys.equipment.maxBodies = 2;
    //            sys.equipment.maxValves = 4; // This needs to be looked at as 3 additional valves can be added with the valve expansion.
    //            sys.equipment.maxSchedules = 99;
    //            sys.equipment.maxFeatures = 10;
    //            sys.equipment.maxCircuits = 7; // 2 filter + 5 aux
    //            sys.equipment.maxCircuitGroups = 3;
    //            sys.equipment.maxIntelliBrites = 10;
    //            break;
    //        case 2: // IntelliTouch i9+3
    //            sys.controllerType = ControllerType.IntelliTouch;
    //            sys.equipment.maxPumps = 8; // All IntelliTouch systems can support 8VF pumps or 4VS and 4VF pumps.
    //            sys.equipment.model = 'IntelliTouch i9+3';
    //            sys.equipment.maxBodies = 2;
    //            sys.equipment.maxValves = 4; // This needs to be looked at as 3 additional valves can be added with the valve expansion.
    //            sys.equipment.maxSchedules = 99;
    //            sys.equipment.maxCircuits = 9; // 1 filter + 8 aux
    //            sys.equipment.maxFeatures = 10;
    //            sys.equipment.maxCircuitGroups = 3;
    //            sys.equipment.maxIntelliBrites = 10;
    //            break;
    //        case 3: // IntelliTouch i5+3S
    //            sys.controllerType = ControllerType.IntelliTouch;
    //            sys.equipment.maxPumps = 8; // All IntelliTouch systems can support 8VF pumps or 4VS and 4VF pumps.
    //            sys.equipment.model = 'IntelliTouch i5+3S';
    //            sys.equipment.maxValves = 4; // This needs to be looked at as 3 additional valves can be added with the valve expansion.
    //            sys.equipment.maxSchedules = 99;
    //            sys.equipment.maxCircuits = 5; // 2 filter + 8 aux
    //            sys.equipment.maxFeatures = 10;
    //            sys.equipment.maxCircuitGroups = 3;
    //            sys.equipment.maxIntelliBrites = 10;
    //            break;
    //        case 4: // IntelliTouch i9+3S
    //            sys.controllerType = ControllerType.IntelliTouch;
    //            sys.equipment.maxPumps = 8; // All IntelliTouch systems can support 8VF pumps or 4VS and 4VF pumps.
    //            sys.equipment.model = 'IntelliTouch i9+3S';
    //            sys.equipment.maxValves = 4; // This needs to be looked at as 3 additional valves can be added with the valve expansion.
    //            sys.equipment.maxSchedules = 99;
    //            sys.equipment.maxCircuits = 9; // 1 filter + 8 aux
    //            sys.equipment.maxFeatures = 10;
    //            sys.equipment.maxCircuitGroups = 3;
    //            sys.equipment.maxIntelliBrites = 10;
    //            break;
    //        case 5: // IntelliTouch i10+3D
    //            sys.controllerType = ControllerType.IntelliTouch;
    //            sys.equipment.maxPumps = 8; // All IntelliTouch systems can support 8VF pumps or 4VS and 4VF pumps.
    //            sys.equipment.model = 'IntelliTouch i10+3D';
    //            sys.equipment.maxBodies = 2;
    //            sys.equipment.maxValves = 6; // This needs to be looked at as 3 additional valves can be added with the valve expansion.
    //            sys.equipment.maxSchedules = 99;
    //            sys.equipment.maxCircuits = 10; // 2 filter + 8 aux
    //            sys.equipment.maxFeatures = 10;
    //            sys.equipment.maxCircuitGroups = 3;
    //            sys.equipment.maxIntelliBrites = 10;
    //            sys.equipment.dual = true;
    //            sys.equipment.shared = false;
    //            sys.equipment.maxChemControllers = sys.equipment.maxChlorinators = 2;
    //            break;
    //        case 13: // EasyTouch2 Models
    //            sys.controllerType = ControllerType.EasyTouch;
    //            // sys.equipment.maxValves = 2; // EasyTouch Systems have Pool/Spa A and B.
    //            sys.equipment.maxSchedules = 12;
    //            sys.equipment.maxPumps = 2; // All EasyTouch systems can support 2 VS, VSF or VF pumps.
    //            sys.equipment.maxCircuitGroups = 0;
    //            sys.board.equipmentIds.invalidIds.add(10); // exclude invalid circuit
    //            sys.board.equipmentIds.invalidIds.add(19); // exclude invalid circuit
    //            sys.equipment.maxValves = 4; // need to check for Single bodies
    //            // will exclude AUX EXTRA 
    //            switch (model1) {
    //                case 0:
    //                    sys.equipment.model = 'EasyTouch2 8';
    //                    sys.equipment.maxBodies = 2;
    //                    sys.equipment.maxCircuits = 8;
    //                    break;
    //                case 1:
    //                    sys.equipment.model = 'EasyTouch2 8P';
    //                    sys.equipment.maxCircuits = 8;
    //                    break;
    //                case 2:
    //                    sys.equipment.model = 'EasyTouch2 4';
    //                    sys.equipment.maxBodies = 2;
    //                    // AuxExtra (20) is valid if not used with solar
    //                    // Thus, valid features can be 11,12,13,14 and 20
    //                    // See #113, 244
    //                    // exclude Aux5-Aux7
    //                    sys.board.equipmentIds.invalidIds.merge([7, 8, 9])
    //                    break;
    //                case 3:
    //                    sys.equipment.model = 'EasyTouch2 4P';
    //                    // AuxExtra (20) is valid if not used with solar
    //                    // Thus, valid features can be 11,12,13,14 and 20
    //                    // See #113
    //                    // exclude Aux5-Aux7
    //                    sys.board.equipmentIds.invalidIds.merge([7, 8, 9])
    //                    break;
    //                case 6:
    //                    sys.equipment.model = 'EasyTouch PSL4'; // POOL AND SPA
    //                    sys.equipment.maxBodies = 2;
    //                    sys.equipment.maxPumps = 1;
    //                    sys.equipment.maxSchedules = 4;
    //                    sys.equipment.maxFeatures = 2;
    //                    // exclude Aux5-Aux7
    //                    sys.board.equipmentIds.invalidIds.merge([7, 8, 9])
    //                    break;
    //                case 7: // EasyTouch PL4 P/N 522523
    //                    sys.equipment.model = 'EasyTouch PL4'; // SINGLE BODY; POOL ONLY
    //                    sys.equipment.maxBodies = 1;
    //                    sys.equipment.maxPumps = 1;
    //                    sys.equipment.maxSchedules = 4;
    //                    sys.equipment.maxFeatures = 2;
    //                    // exclude Aux5-Aux7
    //                    sys.board.equipmentIds.invalidIds.merge([7, 8, 9])
    //                    break;
    //            }
    //            break;

    //        case 14: // EasyTouch1 Models
    //            sys.controllerType = ControllerType.EasyTouch;
    //            sys.equipment.maxValves = 4; // EasyTouch Systems have Pool/Spa A and B.
    //            sys.equipment.maxSchedules = 12;
    //            sys.equipment.maxPumps = 2; // All EasyTouch systems can support 2 VS or VF pumps.
    //            sys.equipment.maxCircuitGroups = 0;
    //            sys.equipment.maxFeatures = 8;
    //            switch (model1) {
    //                case 0:
    //                    sys.equipment.model = 'EasyTouch1 8';
    //                    sys.equipment.maxBodies = 2;
    //                    sys.equipment.maxCircuits = 8;
    //                    break;
    //                case 1:
    //                    sys.equipment.model = 'EasyTouch1 8P';
    //                    sys.equipment.maxCircuits = 8;
    //                    sys.equipment.maxBodies = 1;
    //                    break;
    //                case 2: // check...
    //                    sys.equipment.model = 'EasyTouch1 4';
    //                    sys.equipment.maxBodies = 2;
    //                    break;
    //                case 3: // check...
    //                    sys.equipment.model = 'EasyTouch1 4P';
    //                    sys.equipment.maxBodies = 1;
    //                    break;
    //            }
    //            break;
    //    }
    //    if (sys.controllerType === ControllerType.IntelliTouch) {
    //        sys.equipment.maxCustomNames = 20;
    //        sys.equipment.maxCircuitGroups = 10;
    //        let pnl: ExpansionPanel;
    //        pnl = sys.equipment.expansions.getItemById(1, true);
    //        pnl.type = msg.extractPayloadByte(9) & 0x20;
    //        pnl.name = pnl.type === 32 ? 'i10X' : 'none';
    //        pnl.isActive = pnl.type !== 0;
    //        // if type is i9 or i10 we can have up to 3 expansion boards
    //        if (pnl.isActive) {
    //            sys.equipment.maxCircuits += 10;
    //            sys.equipment.maxValves += 3;
    //        }
    //        pnl = sys.equipment.expansions.getItemById(2, true);
    //        pnl.type = 0; // msg.extractPayloadByte(9) & 0x20;
    //        pnl.name = pnl.type === 1 ? 'i10X' : 'none';
    //        pnl.isActive = pnl.type !== 0;
    //        if (pnl.isActive) {
    //            sys.equipment.maxCircuits += 10;
    //            sys.equipment.maxValves += 3;
    //        }
    //        pnl = sys.equipment.expansions.getItemById(3, true);
    //        pnl.type = 0; // msg.extractPayloadByte(9) & 0x20;
    //        pnl.name = pnl.type === 1 ? 'i10X' : 'none';
    //        pnl.isActive = pnl.type !== 0;
    //        if (pnl.isActive) {
    //            sys.equipment.maxCircuits += 10;
    //            sys.equipment.maxValves += 3;
    //        }
    //    }
    //    if (typeof sys.equipment.model === 'undefined') sys.equipment.model = `Unknown OCP[${model1},${model2}]`;
    //    state.equipment.model = sys.equipment.model;
    //    state.equipment.controllerType = sys.controllerType;
    //    if (sys.equipment.model.includes('PL')) state.equipment.shared = sys.equipment.shared = false;
    //    else if (sys.equipment.model.includes('PSL')) state.equipment.shared = sys.equipment.shared = true;
    //    else['S', 'P', 'D'].includes(sys.equipment.model.slice(-1)) ? state.equipment.shared = sys.equipment.shared = false : state.equipment.shared = sys.equipment.shared = true;
    //    sys.equipment.shared ? sys.board.equipmentIds.circuits.start = 1 : sys.board.equipmentIds.circuits.start = 2;

    //    // shared equipment frees up one physical circuit
    //    sys.equipment.maxCircuits += sys.equipment.shared ? 1 : 0;
    //    state.equipment.maxBodies = sys.equipment.maxBodies;
    //    let heater = sys.heaters.getItemById(1, true);
    //    heater.isActive = true;
    //    heater.type = 1;
    //    heater.name = "Gas Heater";
    //    let sheater = state.heaters.getItemById(1, true);
    //    sheater.type = heater.type;
    //    sheater.name = heater.name;
    //    sheater.isVirtual = heater.isVirtual = false;

    //    sys.equipment.shared ? heater.body = 32 : heater.body = 0;
    //    sys.equipment.setEquipmentIds();
    //    // Initialize the bodies.  We will need these very soon.
    //    for (let i = 1; i <= sys.equipment.maxBodies; i++) {
    //        // Add in the bodies for the configuration.  These need to be set.
    //        let cbody = sys.bodies.getItemById(i, true);
    //        let tbody = state.temps.bodies.getItemById(i, true);
    //        // If the body doesn't represent a spa then we set the type.
    //        tbody.type = cbody.type = i > 1 && !sys.equipment.shared ? 1 : 0;
    //        cbody.isActive = true;
    //        if (typeof cbody.name === 'undefined') {
    //            let bt = sys.board.valueMaps.bodyTypes.transform(cbody.type);
    //            tbody.name = cbody.name = bt.name;
    //        }
    //    }
    //    if (!sys.equipment.shared && !sys.equipment.dual) {
    //        sys.bodies.removeItemById(2);
    //        state.temps.bodies.removeItemById(2);
    //    }
    //    // RKS: 04-14-21 - Remove the spa circuit from the equation if this is a single body panel.
    //    if (sys.equipment.maxBodies === 1) sys.board.equipmentIds.invalidIds.merge([1])
    //    sys.bodies.removeItemById(3);
    //    sys.bodies.removeItemById(4);
    //    state.temps.bodies.removeItemById(3);
    //    state.temps.bodies.removeItemById(4);

    //    sys.board.heaters.initTempSensors();
    //    // time defaults
    //    sys.general.options.clockMode = sys.general.options.clockMode || 12;
    //    sys.general.options.clockSource = sys.general.options.clockSource || 'manual';
    //    // This will let any connected clients know if anything has changed.  If nothing has ...crickets.
    //    state.emitControllerChange();
    //}
    public static initVirtual() {
        state.equipment.controllerType = sys.controllerType = ControllerType.Virtual;
        state.equipment.model = sys.equipment.model = 'Virtual Controller';
        sys.equipment.maxFeatures = 10;
        sys.equipment.maxCircuits = 0;
        sys.equipment.maxSchedules = 0;
        sys.equipment.maxValves = 0;
        sys.equipment.maxIntelliBrites = 0;
        sys.equipment.maxLightGroups = 0;
        sys.equipment.maxCustomNames = 0;
        sys.equipment.maxCircuitGroups = 40;
        // setup pool circuit
        let pool = sys.circuits.getItemById(6, true);
        let spool = state.circuits.getItemById(6, true);
        pool.name = spool.name = 'Pool';
        pool.type = spool.type = 2;
        pool.isActive = true;
        spool.isOn = false;
        const cbody = sys.bodies.getItemById(1, true, { id: 1, isActive: true, name: "Pool" });
        const tbody = state.temps.bodies.getItemById(1, true);
        tbody.heatMode = cbody.heatMode = 0;
        tbody.name = cbody.name;
        tbody.circuit = cbody.circuit = 6;
        tbody.heatStatus = 0;
        tbody.isOn = false;
        sys.general.options.clockMode = 12;
        sys.general.options.clockSource = 'server';
        state.equipment.maxBodies = sys.equipment.maxBodies;
        state.mode = 0;
        state.status = 1;
        state.temps.units = 0;
        sys.equipment.setEquipmentIds();
        state.emitControllerChange();
        sys.board.virtualPumpControllers.start();
        sys.board.heaters.initTempSensors();
        sys.board.heaters.updateHeaterServices();
        sys.board.processStatusAsync();

    }
    private static initController(msg: Inbound) {
        state.status = 1;
        const model1 = msg.extractPayloadByte(27);
        const model2 = msg.extractPayloadByte(28);
        // RKS: 06-15-20 -- While this works for now the way we are detecting seems a bit dubious.  First, the 2 status message
        // contains two model bytes.  Right now the ones witness in the wild include 23 = fw1.023, 40 = fw1.040, 47 = fw1.047.
        if (model2 === 0 && (model1 === 23 || model1 >= 40)) {
            state.equipment.controllerType = 'intellicenter';
            sys.controllerType = ControllerType.IntelliCenter;
            logger.info(`Found Controller Board ${state.equipment.model || 'IntelliCenter'}, awaiting installed modules.`);
            EquipmentStateMessage.initIntelliCenter(msg);
        }
        else {
            EquipmentStateMessage.initTouch(msg);
            logger.info(`Found Controller Board ${state.equipment.model}`);
            sys.board.needsConfigChanges = true;
            setTimeout(function () { sys.checkConfiguration(); }, 300);
        }
    }
    public static process(msg: Inbound) {
        Message.headerSubByte = msg.header[1];
        //console.log(process.memoryUsage());
        if (!state.isInitialized) {
            msg.isProcessed = true;
            if (msg.action === 2) EquipmentStateMessage.initController(msg);
            else return;
        }
        else if (!sys.board.modulesAcquired) {
            msg.isProcessed = true;
            if (msg.action === 204) {
                let board = sys.board as IntelliCenterBoard;
                // We have determined that the 204 message now contains the information
                // related to the installed expansion boards.
                console.log(`INTELLICENTER MODULES DETECTED, REQUESTING STATUS!`);
                // Master = 13-14
                // EXP1 = 15-16
                // EXP2 = 17-18
                let pc = msg.extractPayloadByte(40);
                board.initExpansionModules(msg.extractPayloadByte(13), msg.extractPayloadByte(14),
                    pc & 0x01 ? msg.extractPayloadByte(15) : 0x00, pc & 0x01 ? msg.extractPayloadByte(16) : 0x00,
                    pc & 0x02 ? msg.extractPayloadByte(17) : 0x00, pc & 0x02 ? msg.extractPayloadByte(18) : 0x00,
                    pc & 0x04 ? msg.extractPayloadByte(19) : 0x00, pc & 0x04 ? msg.extractPayloadByte(20) : 0x00);
                sys.equipment.setEquipmentIds();
            }
            else return;
        }
        switch (msg.action) {
            case 2:
                {
                    let fnTempFromByte = function (byte) {
                        return byte;
                        //return (byte & 0x007F) * (((byte & 0x0080) > 0) ? -1 : 1); // RKS: 09-26-20 Not sure how negative temps are represented but this aint it.  Temps > 127 have been witnessed.
                    }

                    // Shared
                    let dt = new Date();
                    if (state.chemControllers.length > 0) {
                        // TODO: move this to chemController when we understand the packets better
                        for (let i = 0; i < state.chemControllers.length; i++) {
                            let ccontroller = state.chemControllers.getItemByIndex(i);
                            if (sys.board.valueMaps.chemControllerTypes.getName(ccontroller.type) === 'intellichem') {
                                if (dt.getTime() - ccontroller.lastComm > 60000) ccontroller.status = 1;
                            }
                        }
                    }
                    state.time.hours = msg.extractPayloadByte(0);
                    state.time.minutes = msg.extractPayloadByte(1);
                    state.time.seconds = dt.getSeconds();
                    state.mode = msg.extractPayloadByte(9) & 0x81;
                    sys.general.options.units = state.temps.units = msg.extractPayloadByte(9) & 0x04;
                    state.valve = msg.extractPayloadByte(10);


                    // RSG - added 7/8/2020
                    // Every 30 mins, check the timezone and adjust DST settings
                    if (dt.getMinutes() % 30 === 0) sys.board.system.setTZ();
                    // Check and update clock when it is off by >5 mins (just for a small buffer) and:
                    // 1. IntelliCenter has "manual" time set (Internet will automatically adjust) and autoAdjustDST is enabled
                    // 2. *Touch is "manual" (only option) and autoAdjustDST is enabled - (same as #1)
                    // 3. clock source is "server" isn't an OCP option but can be enabled on the clients 
                    if (dt.getMinutes() % 5 === 0 && sys.general.options.clockSource === 'server') {
                        if ((Math.abs(dt.getTime() - state.time.getTime()) > 60 * 5 * 1000) && !state.time.isUpdating) {
                            state.time.isUpdating = true;
                            sys.board.system.setDateTimeAsync({ dt, dst: sys.general.options.adjustDST || 0, })
                                .then(() => {
                                    logger.info(`njsPC automatically updated OCP time.  You're welcome.`);
                                })
                                .catch((err) => {
                                    logger.error(`Error automatically setting system time. ${JSON.stringify(err)}`)
                                })
                                .finally(() => {
                                    state.time.isUpdating = false;
                                })
                        }
                    }
                    state.delay = msg.extractPayloadByte(12) & 63; // not sure what 64 val represents
                    state.freeze = (msg.extractPayloadByte(9) & 0x08) === 0x08;
                    if (sys.controllerType === ControllerType.IntelliCenter) {
                        state.temps.waterSensor1 = fnTempFromByte(msg.extractPayloadByte(14));
                        if (sys.bodies.length > 2 || sys.equipment.dual) state.temps.waterSensor2 = fnTempFromByte(msg.extractPayloadByte(15));
                        // We are making an assumption here in that the circuits are always labeled the same.
                        // 1=Spa/Body2
                        // 6=Pool/Body1
                        // 12=Body3
                        // 22=Body4 -- Really not sure about this one.
                        if (sys.bodies.length > 0) {
                            // We will not go in here if this is not a shared body.
                            const tbody: BodyTempState = state.temps.bodies.getItemById(1, true);
                            const cbody: Body = sys.bodies.getItemById(1);
                            tbody.heatMode = cbody.heatMode;
                            tbody.setPoint = cbody.setPoint;
                            tbody.name = cbody.name;
                            tbody.circuit = cbody.circuit = 6;
                            tbody.heatStatus = msg.extractPayloadByte(11) & 0x0F;
                            if ((msg.extractPayloadByte(2) & 0x20) === 32) {
                                tbody.temp = state.temps.waterSensor1;
                                tbody.isOn = true;
                            } else tbody.isOn = false;
                        }
                        if (sys.bodies.length > 1) {
                            const tbody: BodyTempState = state.temps.bodies.getItemById(2, true);
                            const cbody: Body = sys.bodies.getItemById(2);
                            tbody.heatMode = cbody.heatMode;
                            tbody.setPoint = cbody.setPoint;
                            tbody.name = cbody.name;
                            tbody.circuit = cbody.circuit = 1;
                            tbody.heatStatus = (msg.extractPayloadByte(11) & 0xF0) >> 4;
                            if ((msg.extractPayloadByte(2) & 0x01) === 1) {
                                tbody.temp = sys.equipment.shared ? state.temps.waterSensor1 : state.temps.waterSensor2;
                                tbody.isOn = true;
                            } else tbody.isOn = false;
                        }
                        if (sys.bodies.length > 2) {
                            state.temps.waterSensor3 = fnTempFromByte(msg.extractPayloadByte(20));
                            // const tbody: BodyTempState = state.temps.bodies.getItemById(10, true);
                            const tbody: BodyTempState = state.temps.bodies.getItemById(3, true);
                            const cbody: Body = sys.bodies.getItemById(3);
                            tbody.name = cbody.name;
                            tbody.heatMode = cbody.heatMode;
                            tbody.setPoint = cbody.setPoint;
                            tbody.heatStatus = msg.extractPayloadByte(11) & 0x0F;
                            tbody.circuit = cbody.circuit = 12;
                            if ((msg.extractPayloadByte(3) & 0x08) === 8) {
                                // This is the first circuit on the second body.
                                tbody.temp = state.temps.waterSensor3;
                                tbody.isOn = true;
                            } else tbody.isOn = false;
                        }
                        if (sys.bodies.length > 3) {
                            state.temps.waterSensor4 = fnTempFromByte(msg.extractPayloadByte(21));
                            // const tbody: BodyTempState = state.temps.bodies.getItemById(19, true);
                            const tbody: BodyTempState = state.temps.bodies.getItemById(4, true);
                            const cbody: Body = sys.bodies.getItemById(4);
                            tbody.name = cbody.name;
                            tbody.heatMode = cbody.heatMode;
                            tbody.setPoint = cbody.setPoint;
                            tbody.heatStatus = (msg.extractPayloadByte(11) & 0xF0) >> 4;
                            tbody.circuit = cbody.circuit = 22;
                            if ((msg.extractPayloadByte(5) & 0x20) === 32) {
                                // This is the first circuit on the third body or the first circuit on the second expansion.
                                tbody.temp = state.temps.waterSensor2;
                                tbody.isOn = true;
                            } else tbody.isOn = false;
                        }
                        state.temps.air = fnTempFromByte(msg.extractPayloadByte(18)); // 18
                        state.temps.solarSensor1 = fnTempFromByte(msg.extractPayloadByte(19)); // 19
                        if (sys.bodies.length > 2 || sys.equipment.dual)
                            state.temps.solarSensor2 = fnTempFromByte(msg.extractPayloadByte(17));
                        if ((sys.bodies.length > 2))
                            state.temps.solarSensor3 = fnTempFromByte(msg.extractPayloadByte(22));
                        if ((sys.bodies.length > 3))
                            state.temps.solarSensor4 = fnTempFromByte(msg.extractPayloadByte(23));

                        if (sys.general.options.clockSource !== 'server' || typeof sys.general.options.adjustDST === 'undefined') sys.general.options.adjustDST = (msg.extractPayloadByte(23) & 0x01) === 0x0; //23
                    }
                    else {
                        state.temps.waterSensor1 = fnTempFromByte(msg.extractPayloadByte(14));
                        state.temps.air = fnTempFromByte(msg.extractPayloadByte(18));
                        let solar: Heater = sys.heaters.getItemById(2);
                        if (solar.isActive) state.temps.solar = fnTempFromByte(msg.extractPayloadByte(19));
                        //[15, 34, 32, 0, 0, 0, 0, 0, 0, 0, 83, 0, 0, 0, 81, 81, 32, 91, 82, 91, 0, 0, 7, 4, 0, 77, 163, 1, 0][4, 78]
                        // byte | val |
                        // 0    | 15  | Hours
                        // 1    | 34  | Minutes
                        // 2    | 32  | Circuits 1-8 bit 6 = Pool on.
                        // 3    | 0   | Circuits 9-16
                        // 4    | 0   | Circuits 17-24
                        // 5    | 0   | Circuits 24-32
                        // 6    | 0   | Circuits 33-40
                        // 7    | 0   | Unknown
                        // 8    | 0   | Unknown
                        // 9    | 0   | Panel Mode bit flags
                        // 10   | 83  | Heat status for body 1 & 2 (This says solar is on for the pool and spa because this is the body that is running)
                        // 11   | 0   | Unknown (This could be the heat status for body 3 & 4)
                        // 12   | 0   | Unknown
                        // 13   | 0   | Unknown
                        // 14   | 81  | Water sensor 1 temperature
                        // 15   | 81  | Water sensor 2 temperature (This mirrors water sensor 1 in shared system)
                        // 16   | 32  | Unknown
                        // 17   | 91  | Solar sensor 1 temperature
                        // 18   | 82  | Air temp
                        // 19   | 91  | Solar sensor 2 temperature (this mirrors solar sensor 1 in shared system)
                        // 20   | 0   | Unknown (this could be water sensor 3)
                        // 21   | 0   | Unknown (this could be water sensor 4)
                        // 22   | 7   | Body 1 & 2 heat mode (body 1 = Solar Only body 2 = Heater)
                        // 23   | 4   | Body 3 & 4 heat mode
                        // 24   | 0   | Unknown
                        // 25   | 77  | Unknown
                        // 26   | 163 | Unknown
                        // 27   | 1   | Byte 2 of OCP identifier
                        // 28   | 0   | Byte 1 of OCP identifier
                       

                        // Heat Modes
                        // 1 = Heater
                        // 2 = Solar Preferred
                        // 3 = Solar Only

                        // Heat Status
                        // 0 = Off
                        // 1 = Heater
                        // 2 = Cooling
                        // 3 = Solar/Heat Pump

                        // Pool Heat Mode/Status.
                        // When temp setpoint and pool in heater mode went above the current pool temp byte 10 went from 67 to 71.  The upper two bits of the
                        // lower nibble changed on bit 3.  So 0100 0111 from 0100 0011

                        // Spa Heat Mode/Status
                        // When switching from pool to spa with both heat modes set to off byte 10 went from 67 to 75 and byte(16) changed from 0 to 32.  The upper two bits of the lower nibble
                        // changed on byte(10) bit 4.  So to 0100 1011 from 0100 0011.  Interestingly this seems to indicate that the spa turned on.  This almost appears as if the heater engaged
                        // automatically like the spa has manual heat turned off.
                        // When the heat mode was changed to solar only byte 10 went to 75 from 67 so bit 4 switched off and byte(16) changed to 0.  At this point the water temp is 86 and the
                        // solar temp is 79 so the solar should not be coming on.
                        // When the setpoint was dropped below the water temp bit 5 on byte(10) swiched back off and byte(16) remained at 0.  I think there is no bearing here on this.
                        // When the heat mode was changed to solar preferred and the setpoint was raised to 104F the heater kicked on and bit 5 changed from 0 to 1.  So byte(10) went from
                        // 0100 0011 to 0100 1011 this is consistent with the heater coming on for the spa.  In this instance byte(16) also changed back to 32 which would be consistent with
                        // an OCP where the manual heat was turned off.

                        // RKS: Added check for i10d for water sensor 2.
                        if (sys.bodies.length > 2 || sys.equipment.dual) state.temps.waterSensor2 = fnTempFromByte(msg.extractPayloadByte(15));
                        if (sys.bodies.length > 0) {
                            // const tbody: BodyTempState = state.temps.bodies.getItemById(6, true);
                            const tbody: BodyTempState = state.temps.bodies.getItemById(1, true);
                            const cbody: Body = sys.bodies.getItemById(1);
                            if ((msg.extractPayloadByte(2) & 0x20) === 32) {
                                tbody.temp = state.temps.waterSensor1;
                                tbody.isOn = true;
                            } else tbody.isOn = false;
                            tbody.setPoint = cbody.setPoint;
                            tbody.name = cbody.name;
                            tbody.circuit = cbody.circuit = 6;
                            tbody.heatMode = cbody.heatMode = msg.extractPayloadByte(22) & 0x03;
                            let heatStatus = sys.board.valueMaps.heatStatus.getValue('off');
                            if (tbody.isOn) {
                                //const heaterActive = (msg.extractPayloadByte(10) & 0x0C) === 12;
                                //const solarActive = (msg.extractPayloadByte(10) & 0x30) === 48;
                                const heaterActive = (msg.extractPayloadByte(10) & 0x04) === 0x04;
                                const solarActive = (msg.extractPayloadByte(10) & 0x10) === 0x10;
                                const cooling = solarActive && tbody.temp > tbody.setPoint;
                                if (heaterActive) heatStatus = sys.board.valueMaps.heatStatus.getValue('heater');
                                if (cooling) heatStatus = sys.board.valueMaps.heatStatus.getValue('cooling');
                                else if (solarActive) heatStatus = sys.board.valueMaps.heatStatus.getValue('solar');
                            }
                            tbody.heatStatus = heatStatus;
                            sys.board.schedules.syncScheduleHeatSourceAndSetpoint(cbody, tbody);
                        }
                        if (sys.bodies.length > 1) {
                            // const tbody: BodyTempState = state.temps.bodies.getItemById(1, true);
                            const tbody: BodyTempState = state.temps.bodies.getItemById(2, true);
                            const cbody: Body = sys.bodies.getItemById(2);
                            if ((msg.extractPayloadByte(2) & 0x01) === 1) {
                                tbody.temp = sys.equipment.shared ? state.temps.waterSensor1 : state.temps.waterSensor2;
                                tbody.isOn = true;
                            } else tbody.isOn = false;
                            tbody.heatMode = cbody.heatMode = (msg.extractPayloadByte(22) & 0x0C) >> 2;
                            tbody.setPoint = cbody.setPoint;
                            tbody.name = cbody.name;
                            tbody.circuit = cbody.circuit = 1;
                            let heatStatus = sys.board.valueMaps.heatStatus.getValue('off');
                            if (tbody.isOn) {
                                //const heaterActive = (msg.extractPayloadByte(10) & 0x0C) === 12;
                                //const solarActive = (msg.extractPayloadByte(10) & 0x30) === 48;
                                const heaterActive = (msg.extractPayloadByte(10) & 0x08) === 0x08;
                                const solarActive = (msg.extractPayloadByte(10) & 0x20) === 0x20;

                                const cooling = solarActive && tbody.temp > tbody.setPoint;
                                if (heaterActive) heatStatus = sys.board.valueMaps.heatStatus.getValue('heater');
                                if (cooling) heatStatus = sys.board.valueMaps.heatStatus.getValue('cooling');
                                else if (solarActive) heatStatus = sys.board.valueMaps.heatStatus.getValue('solar');
                            }
                            tbody.heatStatus = heatStatus;
                            sys.board.schedules.syncScheduleHeatSourceAndSetpoint(cbody, tbody);
                        }
                    }
                    switch (sys.controllerType) {
                        case ControllerType.IntelliCenter:
                            {
                                EquipmentStateMessage.processCircuitState(msg);
                                // RKS: As of 1.04 the entire feature state is emitted on 204.  This message
                                // used to contain the first 4 feature states starting in byte 8 upper 4 bits
                                // and as of 1.047 release this was no longer reliable.  Macro circuits only appear
                                // to be available on message 30-15 and 168-15.
                                //EquipmentStateMessage.processFeatureState(msg);
                                sys.board.circuits.syncCircuitRelayStates();
                                sys.board.circuits.syncVirtualCircuitStates();
                                sys.board.valves.syncValveStates();
                                state.emitControllerChange();
                                state.emitEquipmentChanges();
                                sys.board.heaters.syncHeaterStates();
                                break;
                            }
                        case ControllerType.IntelliCom:
                        case ControllerType.EasyTouch:
                        case ControllerType.IntelliTouch:
                            {
                                this.processTouchCircuits(msg);
                                // This will toggle the group states depending on the state of the individual circuits.
                                sys.board.circuits.syncCircuitRelayStates();
                                sys.board.features.syncGroupStates();
                                sys.board.circuits.syncVirtualCircuitStates();
                                sys.board.valves.syncValveStates();
                                state.emitControllerChange();
                                state.emitEquipmentChanges();
                                sys.board.heaters.syncHeaterStates();
                                sys.board.schedules.syncScheduleStates();
                                break;
                            }
                    }
                }
                break;
            case 5: // Intellitouch only.  Date/Time packet
                // [255,0,255][165,1,15,16,5,8][15,10,8,1,8,18,0,1][1,15]
                state.time.hours = msg.extractPayloadByte(0);
                state.time.minutes = msg.extractPayloadByte(1);
                // state.time.dayOfWeek = msg.extractPayloadByte(2);
                state.time.date = msg.extractPayloadByte(3);
                state.time.month = msg.extractPayloadByte(4);
                state.time.year = msg.extractPayloadByte(5);
                if (sys.general.options.clockSource !== 'server' || typeof sys.general.options.adjustDST === 'undefined') sys.general.options.adjustDST = msg.extractPayloadByte(7) === 0x01;
                setTimeout(function () { sys.board.checkConfiguration(); }, 100);
                msg.isProcessed = true;
                break;
            case 8: {
                // IntelliTouch only.  Heat status
                // [165,x,15,16,8,13],[75,75,64,87,101,11,0, 0 ,62 ,0 ,0 ,0 ,0] ,[2,190]
                // Heat Modes
                // 1 = Heater
                // 2 = Solar Preferred
                // 3 = Solar Only
                //[81, 81, 82, 85, 97, 7, 0, 0, 0, 100, 100, 4, 0][3, 87]
                // byte | val |
                // 0    | 81  | Water sensor 1
                // 1    | 81  | Unknown (Probably water sensor 2 on a D)
                // 2    | 82  | Air sensor
                // 3    | 85  | Body 1 setpoint
                // 4    | 97  | Body 2 setpoint
                // 5    | 7   | Body 1 & 2 heat mode. (0111) (Pool = 11 Solar only/Spa = 01 Heater)
                // 6    | 0   | Unknown (Water Sensor 3)
                // 7    | 0   | Unknown (Water Sensor 4)
                // 8    | 0   | Unknown -- Reserved air sensor
                // 9    | 100 | Unknown (Body 3 setpoint)
                // 10   | 100 | Unknown (Body 4 setpoint)
                // 11   | 4   | Unknown (Body 3 & 4 head mode. (0010) (Pool = 00 = Off/ 10 = Solar Preferred)
                // 12   | 0   | Unknown
                // There are two messages sent when the OCP tries to tse a heat mode in IntelliTouch.  The first one on the action 136 is for the first 2 bodies and the second
                // is for the remaining 2 bodies.  The second half of this message mirrors the values for the second 136 message.
                // [255, 0, 255][165, 1, 16, 32, 136, 4][100, 100, 4, 1][2, 47]
                state.temps.waterSensor1 = msg.extractPayloadByte(0);
                state.temps.air = msg.extractPayloadByte(2);
                let solar: Heater = sys.heaters.getItemById(2);
                if (solar.isActive) state.temps.solar = msg.extractPayloadByte(8);
                // pool
                let tbody: BodyTempState = state.temps.bodies.getItemById(1, true);
                let cbody: Body = sys.bodies.getItemById(1);
                tbody.heatMode = cbody.heatMode = msg.extractPayloadByte(5) & 3;
                tbody.setPoint = cbody.setPoint = msg.extractPayloadByte(3);
                if (tbody.isOn) tbody.temp = state.temps.waterSensor1;
                cbody = sys.bodies.getItemById(2);
                if (cbody.isActive) {
                    // spa
                    tbody = state.temps.bodies.getItemById(2, true);
                    tbody.heatMode = cbody.heatMode =
                        (msg.extractPayloadByte(5) & 12) >> 2;
                    tbody.setPoint = cbody.setPoint = msg.extractPayloadByte(4);
                    if (tbody.isOn) tbody.temp = state.temps.waterSensor2 = msg.extractPayloadByte(1);
                }
                state.emitEquipmentChanges();
                msg.isProcessed = true;
                break;
            }
            case 96:
                EquipmentStateMessage.processIntelliBriteMode(msg);
                break;
            case 197: {
                // request for date/time on *Touch.  Use this as an indicator
                // that SL has requested config and update lastUpdated date/time
                /* let ver: ConfigVersion =
                    typeof (sys.configVersion) === 'undefined' ? new ConfigVersion({}) : sys.configVersion;
                ver.lastUpdated = new Date();
                sys.processVersionChanges(ver); */
                sys.configVersion.lastUpdated = new Date();
                msg.isProcessed = true;
                break;
            }
            case 204: // IntelliCenter only.
                state.batteryVoltage = msg.extractPayloadByte(2) / 50;
                state.comms.keepAlives = msg.extractPayloadInt(4);
                state.time.date = msg.extractPayloadByte(6);
                state.time.month = msg.extractPayloadByte(7);
                state.time.year = msg.extractPayloadByte(8);
                sys.equipment.controllerFirmware = (msg.extractPayloadByte(42)
                    + (msg.extractPayloadByte(43) / 1000)).toString();
                if (sys.chlorinators.length > 0) {
                    if (msg.extractPayloadByte(37, 255) !== 255) {
                        const chlor = state.chlorinators.getItemById(1);
                        chlor.superChlorRemaining = msg.extractPayloadByte(37) * 3600 + msg.extractPayloadByte(38) * 60;
                    } else {
                        const chlor = state.chlorinators.getItemById(1);
                        chlor.superChlorRemaining = 0;
                        chlor.superChlor = false;
                    }
                }
                ExternalMessage.processFeatureState(9, msg);
                msg.isProcessed = true;
                // state.emitControllerChange();
                // state.emitEquipmentChanges();
                break;
        }
    }
    // RKS: 07-06-20 I am deprecating this from processing in IntelliCenter.  This was a throwback from *Touch but
    // not all the features are represented and I am unsure if it actually processes correctly in all situations.  The
    // bytes may be set but it may also be coincidental.  This is wholly unreliable in 1.047+.  Message 204 contains the complete set.
    //private static processFeatureState(msg: Inbound) {
    //    // Somewhere in this packet we need to find support for 32 bits of features.
    //    // Turning on the first defined feature set by 7 to 16
    //    // Turning on the second defined feature set byte 7 to 32
    //    // This means that the first 4 feature circuits are located at byte 7 on the 4 most significant bits.  This leaves 28 bits
    //    // unaccounted for when it comes to a total of 32 features.

    //    // We do know that the first 6 bytes are accounted for so byte 8, 10, or 11 are potential candidates.
    //    // RKS: 09-26-20 IntelliCenter versions after 1.040 now pass the feature state in message 204.  The 2 data is no longer reliable.
    //    if (parseFloat(sys.equipment.controllerFirmware) <= 1.04) {

    //        // TODO: To RKS, can we combine this and processCircuitState for IntelliCenter?  
    //        // Not exactly sure why we are hardcoding byte 7 here.
    //        // I combined the *touch circuits and features in processTouchCircuits below.
    //        let featureId = sys.board.equipmentIds.features.start;
    //        for (let i = 1; i <= sys.features.length; i++) {
    //            // Use a case statement here since we don't know where to go after 4.
    //            switch (i) {
    //                case 1:
    //                case 2:
    //                case 3:
    //                case 4: {
    //                    const byte = msg.extractPayloadByte(7);
    //                    const feature = sys.features.getItemById(featureId, false, { isActive: false });
    //                    if (feature.isActive !== false) {
    //                        const fstate = state.features.getItemById(featureId, feature.isActive);
    //                        fstate.isOn = (byte >> 4 & 1 << (i - 1)) > 0;
    //                        fstate.name = feature.name;
    //                    }
    //                    break;
    //                }
    //            }
    //            featureId++;
    //        }
    //    }
    //}
    private static processCircuitState(msg: Inbound) {
        // The way this works is that there is one byte per 8 circuits for a total of 5 bytes or 40 circuits.  The
        // configuration already determined how many available circuits we have by querying the model of the panel
        // and any installed expansion panel models.  Only the number of available circuits will appear in this
        // array.
        let circuitId = 1;
        let maxCircuitId = sys.board.equipmentIds.circuits.end;
        for (let i = 2; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            const byte = msg.extractPayloadByte(i);
            // Shift each bit getting the circuit identified by each value.
            for (let j = 0; j < 8; j++) {
                let circuit = sys.circuits.getItemById(circuitId, false, { isActive: false });
                if (circuit.isActive !== false) {
                    let cstate = state.circuits.getItemById(circuitId, circuit.isActive);
                    cstate.isOn = (byte & (1 << j)) > 0;
                    cstate.name = circuit.name;
                    cstate.nameId = circuit.nameId;
                    cstate.showInFeatures = circuit.showInFeatures;
                    cstate.type = circuit.type;
                    if (sys.controllerType === ControllerType.IntelliCenter) {
                        // intellitouch sends a separate msg with themes
                        switch (circuit.type) {
                            case 6: // Globrite
                            case 5: // Magicstream
                            case 8: // Intellibrite
                            case 10: // Colorcascade
                                cstate.lightingTheme = circuit.lightingTheme;
                                break;
                            case 9:
                                cstate.level = circuit.level || 0;
                                break;
                        }
                    }
                }
                circuitId++;
            }
        }
        msg.isProcessed = true;
    }
    private static processTouchCircuits(msg: Inbound) {
        let circuitId = 1;
        let maxCircuitId = sys.board.equipmentIds.features.end;
        for (let i = 2; i < msg.payload.length && circuitId <= maxCircuitId; i++) {
            const byte = msg.extractPayloadByte(i);
            // Shift each bit getting the circuit identified by each value.
            for (let j = 0; j < 8; j++) {
                const circ = sys.circuits.getInterfaceById(circuitId, false, { isActive: false });
                if (!sys.board.equipmentIds.invalidIds.isValidId(circuitId)) {
                    circ.isActive = false;
                }
                if (circ.isActive) {
                    const cstate = state.circuits.getInterfaceById(circuitId, circ.isActive);
                    cstate.showInFeatures = circ.showInFeatures;
                    cstate.isOn = (byte & 1 << j) >> j > 0;
                    cstate.name = circ.name;
                    cstate.type = circ.type;
                    cstate.nameId = circ.nameId;
                }
                else {
                    if (circ instanceof Circuit) {
                        sys.circuits.removeItemById(circuitId);
                        // don't forget to remove from state #257
                        state.circuits.removeItemById(circuitId);
                    }
                    else if (circ instanceof Feature) {
                        sys.features.removeItemById(circuitId);
                        // don't forget to remove from state #257
                        state.features.removeItemById(circuitId);
                    }
                }
                circuitId++;
            }
        }
        // state.body = body;
        //state.emitControllerChange();
        state.emitEquipmentChanges();
        msg.isProcessed = true;
    }
    private static processIntelliBriteMode(msg: Inbound) {
        // eg RED: [165,16,16,34,96,2],[195,0],[2,12]
        // data[0] = color
        const theme = msg.extractPayloadByte(0);
        switch (theme) {
            case 0: // off
            case 1: // on
            case 190: // save
                // case 191: // recall
                // RKS: TODO hold may be in this list since I see the all on and all off command here.  Sync is probably in the colorset message that includes the timings. 
                // do nothing as these don't actually change the state.
                break;

            default:
                {
                    // intellibrite themes
                    // This is an observed message in that no-one asked for it.  *Touch does not report the theme and in fact, it is not even
                    // stored.  Once the message is sent then it throws away the data.  When you turn the light
                    // on again it will be on at whatever theme happened to be set at the time it went off.  We keep this
                    // as a best guess so when the user turns on the light it will likely be the last theme observed.
                    // state.intellibrite.lightingTheme = sys.intellibrite.lightingTheme = theme;
                    const grp = sys.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start);
                    const sgrp = state.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start);
                    grp.lightingTheme = sgrp.lightingTheme = theme;
                    /*                     for (let i = 0; i <= sys.intellibrite.circuits.length; i++) {
                                            let ib = sys.intellibrite.circuits.getItemByIndex(i);
                                            const sgrp = state.lightGroups.getItemById(sys.board.equipmentIds.circuitGroups.start);
                                            let circuit = sys.circuits.getItemById(ib.circuit);
                                            let cstate = state.circuits.getItemById(ib.circuit);
                                            if (cstate.isOn) cstate.lightingTheme = circuit.lightingTheme = theme;
                                        } */
                    for (let i = 0; i < grp.circuits.length; i++) {
                        let c = grp.circuits.getItemByIndex(i);
                        let cstate = state.circuits.getItemById(c.circuit);
                        let circuit = sys.circuits.getInterfaceById(c.circuit);
                        if (cstate.isOn) cstate.lightingTheme = circuit.lightingTheme = theme;
                    }
                    switch (theme) {
                        case 128: // sync
                            sys.board.circuits.sequenceLightGroupAsync(grp.id, 'sync');
                            break;
                        case 144: // swim
                            sys.board.circuits.sequenceLightGroupAsync(grp.id, 'swim');
                            break;
                        case 160: // swim
                            sys.board.circuits.sequenceLightGroupAsync(grp.id, 'set');
                            break;
                        case 190: // save
                        case 191: // recall
                            sys.board.circuits.sequenceLightGroupAsync(grp.id, 'other');
                            break;
                        default:
                            sys.board.circuits.sequenceLightGroupAsync(grp.id, 'color');
                        // other themes for magicstream?

                    }
                    break;
                }
        }
        msg.isProcessed = true;
    }
}
