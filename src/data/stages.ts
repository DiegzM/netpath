import type { StageConfig }   from '../types/curriculum';
import type { Device }         from '../types/device';
import {
  requireDeviceKinds,
  requireAllConnectedTo,
  requireMinConnections,
  composeRules,
} from '../engine/validation';

// ─── Helper: blank device config ──────────────────────────────────────────────

function device(
  id: string,
  kind: Device['kind'],
  label: string,
  x: number,
  y: number,
  ip?: string,
): Device {
  return { id, kind, label, x, y, config: { ip } };
}

// ─── Stage definitions ─────────────────────────────────────────────────────────

export const STAGES: StageConfig[] = [
  {
    id: 1,
    title: 'What is a Network?',
    subtitle: 'The basics of connecting computers',
    arc: 1,
    theory: [
      'A **network** is simply two or more devices connected so they can share information.',
      'The most basic network is just two computers linked by a cable. When Computer A wants to send data to Computer B, it packages it and sends it down the wire.',
      'Every device needs a unique **MAC address** so others know who to talk to.',
    ],
    task: 'Connect the two hosts together to form the world\'s smallest network.',
    hint: 'Click a device to start drawing a cable, then click the second device to complete it.',
    requiredConnections: 1,
    requiredDevices: 2,
    preplacedDevices: [
      device('h1', 'host', 'Host A', 220, 220, '192.168.1.1'),
      device('h2', 'host', 'Host B', 620, 220, '192.168.1.2'),
    ],
    targetDeviceKinds: [],
    validateFn: (_, connections) =>
      connections.length >= 1 ? 'valid' : 'idle',
  },

  {
    id: 2,
    title: 'Adding a Switch',
    subtitle: 'Connecting multiple devices in a LAN',
    arc: 1,
    theory: [
      'A **switch** acts as a central hub — any device can plug in and talk to any other.',
      'Switches forward traffic only to the correct port using a MAC address table, unlike older hubs that broadcast to everyone.',
      'Switches operate at **Layer 2** of the OSI model.',
    ],
    task: 'Connect all three hosts to the switch to form a LAN.',
    hint: 'Drag the Switch from the palette, then connect each host to it.',
    requiredConnections: 3,
    requiredDevices: 4,
    preplacedDevices: [
      device('h1', 'host',   'Host A',   180, 160, '192.168.1.1'),
      device('h2', 'host',   'Host B',   650, 160, '192.168.1.2'),
      device('h3', 'host',   'Host C',   420, 360, '192.168.1.3'),
    ],
    targetDeviceKinds: ['switch'],
    validateFn: composeRules(
      requireDeviceKinds(['switch']),
      requireAllConnectedTo('host', 'switch'),
    ),
  },

  {
    id: 3,
    title: 'Enter the Router',
    subtitle: 'Connecting networks together',
    arc: 1,
    theory: [
      'A **router** connects different networks. While a switch stays inside one LAN, a router decides how to forward packets between distinct networks.',
      'Routers work at **Layer 3** using IP addresses, consulting a routing table to choose the best next hop.',
      'Your home router connects your private LAN to your ISP — bridging two separate address spaces.',
    ],
    task: 'Connect both LANs via the router so all hosts can communicate.',
    hint: 'Connect Switch A to the router\'s left port, Switch B to the right port.',
    requiredConnections: 4,
    requiredDevices: 6,
    preplacedDevices: [
      device('h1',  'host',   'Host A',   120, 180, '10.0.0.1'),
      device('h2',  'host',   'Host B',   120, 310, '10.0.0.2'),
      device('sw1', 'switch', 'Switch A', 300, 245),
      device('h3',  'host',   'Host C',   720, 180, '10.0.1.1'),
      device('h4',  'host',   'Host D',   720, 310, '10.0.1.2'),
      device('sw2', 'switch', 'Switch B', 540, 245),
    ],
    targetDeviceKinds: ['router'],
    validateFn: composeRules(
      requireDeviceKinds(['router']),
      requireMinConnections('router', 2),
    ),
  },

  {
    id: 4,
    title: 'DNS — The Phone Book',
    subtitle: 'Turning names into addresses',
    arc: 1,
    theory: [
      'Typing `google.com` works because a **DNS server** translates that name into an IP address.',
      'Your computer asks: *"What IP does google.com map to?"* The DNS replies, then your browser connects.',
      'Without DNS you\'d need to memorise IP addresses for every website.',
    ],
    task: 'Add a DNS server to the network and connect it to the switch.',
    hint: 'Drag the DNS Server from the palette and cable it into the switch.',
    requiredConnections: 4,
    requiredDevices: 5,
    preplacedDevices: [
      device('h1',  'host',   'Host A', 150, 160, '192.168.1.2'),
      device('h2',  'host',   'Host B', 150, 310, '192.168.1.3'),
      device('sw1', 'switch', 'Switch', 360, 240),
      device('r1',  'router', 'Router', 570, 240),
    ],
    targetDeviceKinds: ['dns-server'],
    validateFn: composeRules(
      requireDeviceKinds(['dns-server']),
      requireMinConnections('dns-server', 1),
    ),
  },

  {
    id: 5,
    title: 'Firewalls & The Internet',
    subtitle: 'Protecting your network at the boundary',
    arc: 1,
    theory: [
      'A **firewall** sits at the edge of your network, inspecting every packet entering or leaving.',
      'Firewalls define rules: allow outbound HTTP, deny unsolicited inbound connections.',
      'The **internet** node is an abstraction representing all external networks beyond your control.',
    ],
    task: 'Complete the network: connect the router to a firewall, then the firewall to the internet.',
    hint: 'The firewall always sits between the router and the internet.',
    requiredConnections: 5,
    requiredDevices: 7,
    preplacedDevices: [
      device('h1',  'host',     'Host A',   80,  160, '192.168.1.2'),
      device('h2',  'host',     'Host B',   80,  310, '192.168.1.3'),
      device('sw1', 'switch',   'Switch',   260, 240),
      device('r1',  'router',   'Router',   440, 240),
      device('net', 'internet', 'Internet', 760, 240),
    ],
    targetDeviceKinds: ['firewall'],
    validateFn: composeRules(
      requireDeviceKinds(['firewall']),
      requireMinConnections('firewall', 2),
    ),
  },
];
