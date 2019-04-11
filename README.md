# Moon Rider

Surf the musical road among the stars, moon, and northern lights. A Web-based
music visualizer powered by the unofficial community
[BeatSaver](https://beatsaver.com) public data set.

Created by the modders and creators of the popular [BeatSaver
Viewer](https://supermedium.com/beatsaver-viewer). And liked by community
admins!

Songs and data are sourced from beatsaver.com. Nothing is hosted by Moon Rider.
If there are any issues, please file requests at
[beatsaver.com](https://beatsaver.com)!

Free and open source. Created with [A-Frame](https://aframe.io) to demonstrate
the Web is capable of high-quality VR experiences and to provide a learning
resource for the developer community.

[**Try the website out now in your browser!**](https://supermedium.com/moonrider/)

Features three modes:

- **Classic Mode** - Surf and slice along the musical road.
- **Punch Mode** - Crush the stars.
- **Ride Mode** - Just sit back and enjoy the ride.

![moonrider](https://user-images.githubusercontent.com/674727/54646629-e91dc600-4a5c-11e9-8a6e-91e77f28523d.jpg)

## Development

moonrider is built with [A-Frame](https://aframe.io) (incl.
[three.js](https://threejs.org) and JavaScript).

```
npm install
npm run start
```

Then head to `localhost:3000` in your browser.

### Debug Flags

| Flag                | Description                                          |
|---------------------|------------------------------------------------------|
| ?debug              | Move controller with mouse.                          |
| ?debugstate=loading | Show loading screen.                                 |
| ?debugstate=victory | Show victory screen.                                 |
| ?godmode            | Never die.                                           |
| ?skipintro          | Skip intro.                                          |
| ?synctest           | Log beat timestamps and automatically destroy beats. |

## Chat with Us

For feedback, bugs, feature requests, or just chatting!

- [Supermedium](https://supermedium.com)
- [Supermedium Discord](https://supermedium.com/discord/)
- [Twitter](https://twitter.com/supermediumvr)
- [BeatSaver Modding Group Discord](https://discordapp.com/invite/6JcXMq3)
