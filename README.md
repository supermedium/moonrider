# Moon Rider

![moonrider](https://user-images.githubusercontent.com/674727/54646629-e91dc600-4a5c-11e9-8a6e-91e77f28523d.jpg)

A free and open source VR music visualization website. Surf the musical road
among the stars, moon, and lights.

From the creators of the [Beat Saver
Viewer](https://supermedium.com/beatsaver-viewer) used by the community to
preview maps.

Songs and data are sourced from beatsaver.com with expressed support from the
Beat Saver community admins. If there are any issues, please file requests at
using the form at [beatsaver.com](https://beatsaver.com).

Built with JavaScript and [A-Frame](https://aframe.io) to demonstrate the Web
is capable of high-quality VR experiences and to provide a learning resource
for the developer community.

[**Try the website out now in your browser!**](https://supermedium.com/moonrider/)

Featuring various modes:

- **Ride Mode** - Just sit back and enjoy the ride.
- **Punch Mode** - Crush the stars.
- **Viewer Mode** - Watch the beatmap within your browser.
- **Classic Mode** - Surf and slice along the musical road.

## Development

```
npm install
npm run start
```

Then head to `localhost:3000` in your browser.

### Debug Flags

| Flag                | Description                                          |
|---------------------|------------------------------------------------------|
| ?debugstate=loading | Show loading screen.                                 |
| ?debugstate=victory | Show victory screen.                                 |
| ?skipintro          | Skip intro.                                          |
| ?synctest           | Log beat timestamps and automatically destroy beats. |
