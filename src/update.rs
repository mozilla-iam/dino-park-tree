use std::sync::RwLock;

use rocket::response::status::BadRequest;
use rocket::State;
use rocket_contrib::Json;

use crate::dino::Dino;
use crate::dino_tree::DinoTree;

#[post("/", format = "application/json", data = "<msg>")]
#[allow(clippy::needless_pass_by_value)]
pub fn cis_update(msg: Json, forrest: State<RwLock<DinoTree>>) -> Result<Json, BadRequest<Json>> {
    let profile_update = msg.into_inner();
    let dino = Dino::from(&profile_update)
        .ok_or_else(|| BadRequest(Some(Json(json!({ "error": "invalid update" })))))?;
    println!("updating {:?}", dino);
    forrest
        .write()
        .map_err(|e| e.to_string())
        .and_then(|mut f| f.update(&dino))
        .map(|_| Json(json!({ "status": "amazing" })))
        .map_err(|e| BadRequest(Some(Json(json!({ "error": e.to_string() })))))
}
