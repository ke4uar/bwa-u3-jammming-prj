let userAccessToken = "";
const clientID = "47498ed3870e4f58a1fd13d3b44205dd";
const redirectURI = "http://localhost:3000/";

const Spotify = {
  getAccessToken() {
    if (userAccessToken) {
      return userAccessToken;
    }

    const url = window.location.href;

    const accessToken = url.match(/access_token=([^&]*)/);
    const expiresIn = url.match(/expires_in=([^&]*)/);

    if (accessToken && expiresIn) {
      userAccessToken = accessToken[1];
      const expirationTime = Number(expiresIn[1]);
      window.setTimeout(() => {
        userAccessToken = "";
      }, expirationTime * 1000);
      window.history.pushState("For Access Token", null, "/");
      return userAccessToken;
    } else {
      window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
    }
  },

  search(term) {
    const accessToken = this.getAccessToken();
    const endpoint = `https://api.spotify.com/v1/search?type=TRACK&q=${term}`;
    return fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
      .then(response => response.json())
      .then(jsonResponse => {
        console.log(jsonResponse);
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map(currTrack => {
          return {
            id: currTrack.id,
            name: currTrack.name,
            artist: currTrack.artists[0].name,
            album: currTrack.album.name,
            uri: currTrack.uri
          };
        });
      });
  },

  savePlaylist(playlistName, trackURIs) {
    if (!playlistName || !trackURIs) {
      return;
    }

    const accessToken = this.getAccessToken();

    return fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
      .then(response => response.json())
      .then(jsonResponse => jsonResponse.id)
      .then(userID => {
        fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ name: playlistName }),
          method: "POST"
        })
          .then(response => response.json())
          .then(jsonResponse => {
            const playlistId = jsonResponse.id;
            const addSongsURL = `https://api.spotify.com/v1/users/${userID}/playlists/${playlistId}/tracks`;
            fetch(addSongsURL, {
              headers: {
                Authorization: `Bearer ${accessToken}`
              },
              body: JSON.stringify({ uris: trackURIs }),
              method: "POST"
            });
          });
      });
  }
};

export default Spotify;

//https://accounts.spotify.com/authorize?client_id=CLIENT_ID&response_type=token&scope=playlist-modify-public&redirect_uri=REDIRECT_URI
