import * as signalR from '@microsoft/signalr';

export const conn = new signalR.HubConnectionBuilder()
  .withUrl(`http://localhost:5230/deviceHub`)
  .build();
