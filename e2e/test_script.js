import { runModel, createParameters } from '../build/nimue.js'
import LCA from '../data/LCA.json'
import NGA from '../data/NGA.json'
import IND from '../data/IND.json'


window.runModel = runModel;
window.createParameters = createParameters;
window.LCA = LCA
window.NGA = NGA;
window.IND = IND;
