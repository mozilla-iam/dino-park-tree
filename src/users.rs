use std::sync::Mutex;

use rocket::response::status::NotFound;
use rocket::State;
use rocket_contrib::Json;

use crate::dino_tree::DinoTree;

#[get("/")]
#[allow(clippy::needless_pass_by_value)]
pub fn users(forrest: State<Mutex<DinoTree>>) -> Result<Json, NotFound<Json>> {
    forrest
        .lock()
        .map_err(|e| e.to_string())
        .map(|tree| {
            json!(
                tree.user_id_to_index
                    .keys()
                    .cloned()
                    .collect::<Vec<String>>()
            )
        }).map(Json)
        .map_err(|e| NotFound(Json(json!({ "error": e }))))
}
