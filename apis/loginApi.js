import axios from "axios";

const API_URL = 'https://apisvc.srilankainsurance.com/MgtDashboardApiServer/api/login'

async function LoginAPI(username, PASSWORD) {
    try {
        const response = await axios.get(API_URL);

        const responsePost =  await axios.post(API_URL, {
            USERNAME: 'dgm@slic.com',
            PASSWORD: 'dgm123'
        })

        console.log(responsePost.data)

          console.log(response.data);
          return response.data;
    } catch {
        console.error("GET error:", error);
        return null;
    }
}

export default LoginAPI;