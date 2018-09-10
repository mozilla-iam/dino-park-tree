use std::sync::RwLock;

use rocket::response::status::NotFound;
use rocket::State;
use rocket_contrib::Json;

use crate::dino_tree::DinoTree;

#[get("/<user_id>")]
pub fn related(user_id: String, forrest: State<RwLock<DinoTree>>) -> Result<Json, NotFound<Json>> {
    forrest
        .read()
        .map_err(|e| format!("{}", e))
        .map(|tree| {
            let manager = tree.get_manager(&user_id);
            let directs = tree.get_directs(&user_id);
            json!({
                "manager": manager,
                "directs": directs,
            })
        }).map(Json)
        .map_err(|e| NotFound(Json(json!({ "error": e }))))
}

#[get("/")]
pub fn orgchart(forrest: State<RwLock<DinoTree>>) -> Result<Json, NotFound<Json>> {
    forrest
        .read()
        .map_err(|e| format!("{}", e))
        .map(|f| Json(f.full.clone()))
        .map_err(|e| NotFound(Json(json!({ "error": e }))))
}
